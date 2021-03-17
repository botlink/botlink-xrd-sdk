#include "xrdconnection_wrapper.h"

#include "botlink_api_wrapper.h"

#include <napi.h>

#include <iostream>
#include <functional>
#include <string>

namespace {

template<class T>
class ConnectWorker : public Napi::AsyncWorker {
public:
    ConnectWorker(Napi::Env& env,
                  Napi::Promise::Deferred&& deferred,
                  std::function<T> action,
                  std::atomic<bool>& cancelled,
                  Napi::ObjectReference&& connectionRef,
                  botlink::Public::XrdConnection& connection)
    : Napi::AsyncWorker(env)
    , _deferred(deferred)
    , _action(action)
    , _connectionRef(std::move(connectionRef))
    , _connection(&connection)
    , _isCancelled(&cancelled)
    {}

    void Execute()
    {
        try {
            auto future = _action();

            while (true) {
                const std::future_status status = future.wait_for(std::chrono::milliseconds(100));
                if (status == std::future_status::ready) {
                    break;
                } else if (status == std::future_status::timeout) {
                    if (_isCancelled->load()) {
                        // Still need to call cancelOpen() in case an
                        // async race in the relay app caused the call
                        // to cancelOpen() in closeConnection() to
                        // happen before the call to openConnection()
                        _connection->cancelOpen();
                        SetError("Connection attempt cancelled");
                        break;
                    }
                } else {
                    break;
                }
            }

            _result = future.get();
            if (!_result) {
                SetError("Failed to start connection");
            }
        } catch (const std::runtime_error& e) {
            SetError(e.what());
        }
    }

    void OnOK()
    {
        try {
            _deferred.Resolve(Napi::Boolean::New(Env(), _result));
        } catch (const Napi::Error& e) {
            std::cerr << "Got error from deferred resolve: '" << e.what() << "'\n";
        }
    }

    void OnError(const Napi::Error& error)
    {
        try {
            _deferred.Reject(error.Value());
        } catch (const Napi::Error& e) {
            std::cerr << "Got error from deferred reject: '" << e.what() << "'\n";
        }
    }

private:
    Napi::Promise::Deferred _deferred;
    bool _result;
    std::function<T> _action;
    // Hold a reference to the javascript object so we don't need to
    // worry about lifetimes
    Napi::ObjectReference _connectionRef;
    botlink::Public::XrdConnection* _connection;
    std::atomic<bool>* _isCancelled;
};
}

namespace botlink {
namespace wrapper {

Napi::Object XrdConnection::Init(Napi::Env env, Napi::Object exports)
{
    Napi::Function func =
        DefineClass(env,
                    "XrdConnection",
                    {InstanceMethod("openConnection", &XrdConnection::openConnection),
                     InstanceMethod("closeConnection", &XrdConnection::closeConnection),
                     InstanceMethod("isConnected", &XrdConnection::isConnected),
                     InstanceMethod("getAutopilotMessage", &XrdConnection::getAutopilotMessage),
                     InstanceMethod("sendAutopilotMessage", &XrdConnection::sendAutopilotMessage),
                     InstanceMethod("startEmitter", &XrdConnection::startEmitter),
                     InstanceMethod("stopEmitter", &XrdConnection::stopEmitter),
                     InstanceMethod("addVideoTrack", &XrdConnection::addVideoTrack),
                     InstanceMethod("setVideoPortInternal", &XrdConnection::setVideoPortInternal),
                     InstanceMethod("logFromGcs", &XrdConnection::logFromGcs),
                     InstanceMethod("logToGcs", &XrdConnection::logToGcs)});

    Napi::FunctionReference* constructor = new Napi::FunctionReference;
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);

    exports.Set("XrdConnection", func);
    return exports;
}

XrdConnection::XrdConnection(const Napi::CallbackInfo& info)
: Napi::ObjectWrap<XrdConnection>(info)
, _runWorkerThread(false)
, _cancelConnectionAttempt(false)
{
    Napi::Env env = info.Env();
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Wrong number of arguments. "
                             "Need API object and XRD hardware ID.")
            .ThrowAsJavaScriptException();
    }

    if (!info[0].IsObject()) {
        Napi::TypeError::New(env, "Wrong argument for API object.")
            .ThrowAsJavaScriptException();
    }

    if (!info[1].IsString()) {
        Napi::TypeError::New(env, "Wrong argument for XRD hardware ID. "
                             "Expected string.")
            .ThrowAsJavaScriptException();
    }

    bool enableLogging = false;
    if ((info.Length() == 3) && info[2].IsBoolean()) {
        enableLogging = info[2].As<Napi::Boolean>();
    }

    // Hold reference to javascript object so we don't have to worry about
    // dangling pointers.
    Napi::Object obj = info[0].As<Napi::Object>();
    _api =  Napi::ObjectReference::New(obj, 1);
    BotlinkApi* apiWrapper = Napi::ObjectWrap<BotlinkApi>::Unwrap(obj);

    std::string xrdHardwareId = info[1].As<Napi::String>();
    _conn = std::make_unique<botlink::Public::XrdConnection>(apiWrapper->getApi(),
                                                             xrdHardwareId,
                                                             enableLogging);
}


Napi::Value XrdConnection::openConnection(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    constexpr size_t numArgs = 1;
    if (info.Length() != numArgs) {
        Napi::TypeError::New(env, "Wrong number of arguments. "
                             "Need timeout argument in seconds.")
            .ThrowAsJavaScriptException();
    }

    if (!info[0].IsNumber()) {
        Napi::TypeError::New(env, "Wrong argument for timeout in seconds. Expected number.")
            .ThrowAsJavaScriptException();
    }

    _cancelConnectionAttempt = false;

    std::chrono::seconds timeout(info[0].As<Napi::Number>());

    // create function here and perform entire connection process on worker
    // thread so that any HTTP requests by openConnection() won't block
    // node.js's main thread.
    // TODO(cgrahn): Update here if/when BotlinkApi class is non-blocking
    auto openFn = [&conn = *_conn, timeout] () {
        return conn.open(timeout); };
    auto deferred = Napi::Promise::Deferred::New(env);

    Napi::Object obj = info.This().As<Napi::Object>();
    Napi::ObjectReference ref = Napi::ObjectReference::New(obj, 1);

    // node.js garbage collects this
    auto* worker = new ConnectWorker<std::future<bool>()>(env, std::move(deferred), openFn, _cancelConnectionAttempt, std::move(ref), *_conn);
    worker->Queue();

    return deferred.Promise();
}

Napi::Value XrdConnection::closeConnection(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();

    // clean up any connection that is in progress
    _conn->cancelOpen();
    _cancelConnectionAttempt = true;

    bool success = _conn->close();

    return Napi::Boolean::New(env, success);
}

Napi::Value XrdConnection::isConnected(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();

    bool connected = _conn->isConnected();

    return Napi::Boolean::New(env, connected);
}

Napi::Value XrdConnection::getAutopilotMessage(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    if (info.Length() != 1) {
        Napi::TypeError::New(env, "Wrong number of arguments")
            .ThrowAsJavaScriptException();
    }

    if (!info[0].IsBoolean()) {
        Napi::TypeError::New(env, "Wrong argument. Expected boolean.")
            .ThrowAsJavaScriptException();
    }

    bool block = info[0].As<Napi::Boolean>();

    std::vector<uint8_t> msg = _conn->getAutopilotMessage(block);

    // TODO(cgrahn): Something to tie life of vector to buffer. That way we can
    // avoid the copy here.
    Napi::Buffer<uint8_t> obj = Napi::Buffer<uint8_t>::Copy(env, &msg[0], msg.size());

    return obj;
}

Napi::Value XrdConnection::sendAutopilotMessage(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    if (info.Length() != 1) {
        Napi::TypeError::New(env, "Wrong number of arguments")
            .ThrowAsJavaScriptException();
    }

    // This is to match the types that xrdSocket.ts accepts (except String, we
    // only want binary data here).
    if (!(info[0].IsBuffer() || info[0].IsTypedArray())) {
        Napi::TypeError::New(env, "Wrong argument. Expected Buffer or Uint8Array.")
            .ThrowAsJavaScriptException();
    }

    std::vector<uint8_t> msg;

    if (info[0].IsBuffer()) {
        auto obj = info[0].As<Napi::Buffer<uint8_t>>();
        uint8_t* start = obj.Data();
        size_t length = obj.Length();
        msg.insert(msg.end(), start, start + length);
    } else {
        auto obj = info[0].As<Napi::Uint8Array>();
        uint8_t* start = obj.Data();
        size_t length = obj.ByteLength();
        msg.insert(msg.end(), start, start + length);
    }

    // TODO(cgrahn): If implementation sends immediately, we can get rid of the
    // copy from the Buffer/Array object into a std::vector in this function and
    // overload _conn->sendAutopilotMessage() to take a pointer and length
    // arguments.
    bool success = false;
    try {
        success = _conn->sendAutopilotMessage(msg);
    } catch (const botlink::Public::exception::BotlinkRuntime& e) {
        Napi::Error::New(env, e.what())
            .ThrowAsJavaScriptException();
    } catch (const botlink::Public::exception::BotlinkLogic& e) {
        Napi::Error::New(env, e.what())
            .ThrowAsJavaScriptException();
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Unexpected error: ") + e.what())
            .ThrowAsJavaScriptException();
    }

    return Napi::Boolean::New(env, success);
}

Napi::Value XrdConnection::logFromGcs(const Napi::CallbackInfo& info)
{
    return logAutopilotMessage(info, botlink::Public::MessageSource::FromGcs);
}

Napi::Value XrdConnection::logToGcs(const Napi::CallbackInfo& info)
{
    return logAutopilotMessage(info, botlink::Public::MessageSource::ToGcs);
}

Napi::Value XrdConnection::startEmitter(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    if (_runWorkerThread) {
        // thread is already running
        // Only need to check this variable as node.js is
        // single-threaded. So there's no race condition by not
        // holding a mutex until thread is created.
        return Napi::Boolean::New(env, true);
    }
    _runWorkerThread = true;

    Napi::Function emit = info.This().As<Napi::Object>().Get("emit")
        .As<Napi::Function>();
    Napi::Function bound = emit.Get("bind").As<Napi::Function>()
        .Call(emit, { info.This() }).As<Napi::Function>();

    _workerFn = Napi::ThreadSafeFunction::New(
        env,
        bound,         // JavaScript function called asynchronously
        "XrdConnection worker", // Name
        0,             // Unlimited queue
        1,             // Only one thread will use this initially
        [&workerThread = _workerThread]( Napi::Env ) { // Finalizer
            workerThread.join();
        } );

    // Create a native thread
    _workerThread = std::thread( [&fn = _workerFn, &conn = *_conn,
                                  &run = _runWorkerThread] {
        auto callback = []( Napi::Env env, Napi::Function jsCallback,
                            std::vector<uint8_t>* msg) {
            // Transform native data into JS data, passing it to the provided
            // `jsCallback` -- the TSFN's JavaScript function.
            Napi::Buffer<uint8_t> obj =
                Napi::Buffer<uint8_t>::Copy(env, &(*msg)[0], msg->size());
            jsCallback.Call( {Napi::String::New( env, "data" ), obj} );

            // We're finished with the data.
            delete msg;
        };

        while (true)
        {
            const auto timeout = std::chrono::milliseconds(1000);

            auto msg = std::make_unique<std::vector<uint8_t>>();
            *msg = conn.getAutopilotMessage(timeout);

            if (msg->size() > 0) {
                // Perform a blocking call
                napi_status status = fn.BlockingCall(msg.release(), callback);
                if (status != napi_ok)
                {
                    // Handle error
                    break;
                }
            } else if (!run) {
                break;
            }
        }

        // Release the thread-safe function
        fn.Release();
    } );

    return Napi::Boolean::New(env, true);
}

Napi::Value XrdConnection::stopEmitter(const Napi::CallbackInfo& info)
{
    _runWorkerThread = false;

    Napi::Env env = info.Env();
    return Napi::Boolean::New(env, true);
}

Napi::Value XrdConnection::addVideoTrack(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();

    if(!_videoForwarder.init()) {
        Napi::Error::New(env, "Failed to initialize UDP socket for "
                         "forwarding video.")
            .ThrowAsJavaScriptException();
    }

    auto callback = [&forwarder = _videoForwarder]
        (uint8_t* packet, size_t length) {
        if (forwarder.getPort() == 0) {
            // The video port hasn't been set yet. So do nothing.
            return;
        }

        if (!forwarder.forward(packet, length)) {
            std::cerr << "Error sending RTP packet over UDP\n";
        }
    };

    _conn->addVideoTrack(callback);
    return Napi::Boolean::New(env, true);
}

Napi::Value XrdConnection::setVideoPortInternal(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    if (!(info.Length() == 1 && info[0].IsNumber())) {
        Napi::TypeError::New(env, "Wrong number of arguments. "
                             "Need one argument that is a number.")
            .ThrowAsJavaScriptException();
    }

    _videoForwarder.setPort(info[0].As<Napi::Number>().Int32Value());

    std::cout << "Set internal video port to " << _videoForwarder.getPort() << "\n";

    return Napi::Boolean::New(env, true);
}

Napi::Value XrdConnection::logAutopilotMessage(const Napi::CallbackInfo& info,
                                               botlink::Public::MessageSource source)
{
    Napi::Env env = info.Env();
    if (info.Length() != 1) {
        Napi::TypeError::New(env, "Wrong number of arguments")
            .ThrowAsJavaScriptException();
    }

    // This is to match the types that xrdSocket.ts accepts (except String, we
    // only want binary data here).
    if (!(info[0].IsBuffer() || info[0].IsTypedArray())) {
        Napi::TypeError::New(env, "Wrong argument. Expected Buffer or Uint8Array.")
            .ThrowAsJavaScriptException();
    }

    std::vector<uint8_t> msg;

    if (info[0].IsBuffer()) {
        auto obj = info[0].As<Napi::Buffer<uint8_t>>();
        uint8_t* start = obj.Data();
        size_t length = obj.Length();
        msg.insert(msg.end(), start, start + length);
    } else {
        auto obj = info[0].As<Napi::Uint8Array>();
        uint8_t* start = obj.Data();
        size_t length = obj.ByteLength();
        msg.insert(msg.end(), start, start + length);
    }

    _conn->logAutopilotMessage(source, msg);
    bool success = true;

    return Napi::Boolean::New(env, success);
}

}
}
