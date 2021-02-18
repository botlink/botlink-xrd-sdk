#include "xrdconnection_wrapper.h"

#include "botlink_api_wrapper.h"

#include <napi.h>

#include <functional>
#include <string>

namespace {

template<class T>
class ConnectWorker : public Napi::AsyncWorker {
public:
    ConnectWorker(Napi::Env& env,
                  Napi::Promise::Deferred&& deferred,
                  std::function<T> action)
    : Napi::AsyncWorker(env)
    , _deferred(deferred)
    , _action(action)
    {}

    void Execute()
    {
        try {
            auto future = _action();
            _result = future.get();
        } catch (const std::runtime_error& e) {
            SetError(e.what());
        }
    }

    void OnOK()
    {
        _deferred.Resolve(Napi::Boolean::New(Env(), _result));
    }

    void OnError(const Napi::Error& error)
    {
        _deferred.Reject(error.Value());
    }

private:
    Napi::Promise::Deferred _deferred;
    bool _result;
    std::function<T> _action;
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
                     InstanceMethod("start", &XrdConnection::start)});

    Napi::FunctionReference* constructor = new Napi::FunctionReference;
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);

    exports.Set("XrdConnection", func);
    return exports;
}

XrdConnection::XrdConnection(const Napi::CallbackInfo& info)
: Napi::ObjectWrap<XrdConnection>(info)
, _runWorkerThread(false)
{
    Napi::Env env = info.Env();
    if (info.Length() != 2) {
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

    // Hold reference to javascript object so we don't have to worry about
    // dangling pointers.
    Napi::Object obj = info[0].As<Napi::Object>();
    _api =  Napi::ObjectReference::New(obj);
    BotlinkApi* apiWrapper = Napi::ObjectWrap<BotlinkApi>::Unwrap(obj);

    std::string xrdHardwareId = info[1].As<Napi::String>();
    _conn = std::make_unique<botlink::Public::XrdConnection>(apiWrapper->getApi(),
                                                             xrdHardwareId);
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

    std::chrono::seconds timeout(info[0].As<Napi::Number>());

    // create function here and perform entire connection process on worker
    // thread so that any HTTP requests by openConnection() won't block
    // node.js's main thread.
    // TODO(cgrahn): Update here if/when BotlinkApi class is non-blocking
    auto openFn = [&conn = *_conn, timeout] () {
        return conn.open(timeout); };
    auto deferred = Napi::Promise::Deferred::New(env);

    // node.js garbage collects this
    auto* worker = new ConnectWorker<std::future<bool>()>(env, std::move(deferred), openFn);
    worker->Queue();

    return deferred.Promise();
}

Napi::Value XrdConnection::closeConnection(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();

    bool success = _conn->close();

    _runWorkerThread = false;

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

Napi::Value XrdConnection::start(const Napi::CallbackInfo& info)
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

}
}
