#include "xrdconnection_wrapper.h"

#include "botlink_api_wrapper.h"
#include "logger_wrapper.h"

#include <napi.h>

#include <functional>
#include <string>

namespace {

std::pair<int, int> resolutionStringToInt(const std::string& resolution);
std::string resolutionIntToString(const int width, const int height);

namespace connectionStatus {
const char connected[] = "Connected";
const char disconnected[] = "Disconnected";
const char event[] = "connectionStatus";
}

template<class T>
class ConnectWorker : public Napi::AsyncWorker {
public:
    ConnectWorker(Napi::Env& env,
                  Napi::Promise::Deferred deferred,
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
            fprintf(stderr, "Got error from deferred resolve: '%s'\n",
                    e.what());
        }
    }

    void OnError(const Napi::Error& error)
    {
        try {
            _deferred.Reject(error.Value());
        } catch (const Napi::Error& e) {
            fprintf(stderr, "Got error from deferred reject: '%s'\n", e.what());
        }
    }

private:
    Napi::Promise::Deferred _deferred;
    std::atomic<bool> _result;
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

void VideoConfigThreadsafe::setConfig(const botlink::Public::VideoConfig& config)
{
    std::lock_guard<std::mutex> lock(_mutex);
    _config = config;
}

// Get the video config and clear any stored video config that was set
// by a callback.
std::optional<botlink::Public::VideoConfig> VideoConfigThreadsafe::getConfig()
{
    std::lock_guard<std::mutex> lock(_mutex);
    std::optional<botlink::Public::VideoConfig> copy = _config;
    _config.reset();
    return copy;
}

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
                     InstanceMethod("addVideoTrack", &XrdConnection::addVideoTrack),
                     InstanceMethod("setVideoForwardPort", &XrdConnection::setVideoForwardPort),
                     InstanceMethod("setVideoConfig", &XrdConnection::setVideoConfig)});

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
, _videoConfig(std::make_shared<VideoConfigThreadsafe>())
{
    Napi::Env env = info.Env();
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Wrong number of arguments. "
                             "Need API object and XRD hardware ID.")
            .ThrowAsJavaScriptException();
    }

    const auto& apiJs = info[0];
    if (!apiJs.IsObject()) {
        Napi::TypeError::New(env, "Wrong argument for API object.")
            .ThrowAsJavaScriptException();
    }

    const auto& xrdJs = info[1];
    if (!xrdJs.IsObject()) {
        Napi::TypeError::New(env, "Wrong argument for XRD. "
                             "Expected object.")
            .ThrowAsJavaScriptException();
    }

    // Hold reference to javascript object so we don't have to worry about
    // dangling pointers.
    Napi::Object obj = apiJs.As<Napi::Object>();
    _api =  Napi::ObjectReference::New(obj, 1);
    BotlinkApi* apiWrapper = Napi::ObjectWrap<BotlinkApi>::Unwrap(obj);

    Public::Xrd xrd;
    xrd.name = xrdJs.As<Napi::Object>().Get("name").As<Napi::String>();
    xrd.hardwareId = xrdJs.As<Napi::Object>().Get("hardwareId").As<Napi::String>();
    xrd.id = xrdJs.As<Napi::Object>().Get("id").As<Napi::Number>().Int32Value();

    Napi::Object logger;
    if ((info.Length() == 3) && info[2].IsObject()) {
        logger = info[2].As<Napi::Object>();
        // Hold reference to javascript object so we don't have to worry about
        // a dangling pointer in the lambda we create.
        _logger =  Napi::ObjectReference::New(logger, 1);
        XrdLogger* loggerWrapper = Napi::ObjectWrap<XrdLogger>::Unwrap(logger);
        Public::XrdConnection::LogMessageFn logFn = [logger = loggerWrapper]
            (Public::MessageSource source, const std::vector<uint8_t>& message) -> void {
            logger->logMessage(static_cast<uint8_t>(source), message);
        };
        _conn = std::make_unique<botlink::Public::XrdConnection>(apiWrapper->getApi(),
                                                                 xrd,
                                                                 logFn);
    } else {
        _conn = std::make_unique<botlink::Public::XrdConnection>(apiWrapper->getApi(),
                                                                 xrd);
    }
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

    startEmitter(info);

    // node.js garbage collects this
    auto* worker = new ConnectWorker<std::future<bool>()>(env, deferred, openFn, _cancelConnectionAttempt, std::move(ref), *_conn);
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

    stopEmitter(info);

    if (success) {
        Napi::Function emit = info.This().As<Napi::Object>().Get("emit")
            .As<Napi::Function>();
        Napi::Function bound = emit.Get("bind").As<Napi::Function>()
            .Call(emit, { info.This() }).As<Napi::Function>();
        bound.Call({Napi::String::New(env, connectionStatus::event),
                Napi::String::New(env, connectionStatus::disconnected)});
    }

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

    Napi::ThreadSafeFunction workerFn = Napi::ThreadSafeFunction::New(
        env,
        bound,         // JavaScript function called asynchronously
        "XrdConnection worker", // Name
        0,             // Unlimited queue
        1,             // Only one thread will use this initially
        []( Napi::Env ) { // Finalizer
            // Do nothing. closeConnection() calls stopEmitter(),
            // which cleans up the thread.
        } );

    // Create a native thread
    _workerThread = std::thread( [fn = std::move(workerFn), &conn = *_conn,
                                  &run = _runWorkerThread,
                                  videoConfig = _videoConfig] () mutable {
        auto callback = []( Napi::Env env, Napi::Function jsCallback,
                            std::vector<uint8_t>* msg) {
            // Transform native data into JS data, passing it to the provided
            // `jsCallback` -- the TSFN's JavaScript function.
            Napi::Buffer<uint8_t> obj =
                Napi::Buffer<uint8_t>::Copy(env, &(*msg)[0], msg->size());
            jsCallback.Call( {Napi::String::New( env, "autopilotMessage" ), obj} );

            // We're finished with the data.
            delete msg;
        };

        auto callbackVideo = []( Napi::Env env, Napi::Function jsCallback,
                                 botlink::Public::VideoConfig* config) {
            // Transform native data into JS data, passing it to the provided
            // `jsCallback` -- the TSFN's JavaScript function.
            // TODO(cgrahn): No object for now, add config object to Call
            auto videoConfig = Napi::Object::New(env);
            const std::string resolution = resolutionIntToString(config->width,
                                                                 config->height);
            videoConfig.Set("resolution", Napi::Value::From(env, resolution));
            videoConfig.Set("framerate", Napi::Value::From(env, config->framerate));

            switch (config->codec) {
                // Note that the strings we use for the value in the call to
                // Set() must match the values in the XrdVideoCodec enum in
                // binding.ts
                case botlink::Public::VideoCodec::H264:
                    videoConfig.Set("codec", Napi::Value::From(env, "H264"));
                    break;
                case botlink::Public::VideoCodec::H265:
                    videoConfig.Set("codec", Napi::Value::From(env, "H265"));
                    break;
                default:
                    videoConfig.Set("codec", Napi::Value::From(env, "Unknown"));
                    break;
            }

            jsCallback.Call( {Napi::String::New( env, "videoConfig" ), videoConfig} );

            delete config;
        };

        auto callbackConnectionStatus = []( Napi::Env env, Napi::Function jsCallback,
                                            bool* connected) {
            // Transform native data into JS data, passing it to the provided
            // `jsCallback` -- the TSFN's JavaScript function.
            // TODO(cgrahn): Use enum instead of bool?
            if (*connected) {
                jsCallback.Call({Napi::String::New(env, connectionStatus::event),
                        Napi::String::New(env, connectionStatus::connected)});
            } else {
                jsCallback.Call({Napi::String::New(env, connectionStatus::event),
                        Napi::String::New(env, connectionStatus::disconnected)});
            }

            delete connected;
        };

        bool connected = conn.isConnected();

        auto tasksLastRan = std::chrono::steady_clock::now();
        while (true)
        {
            constexpr auto timeout = std::chrono::milliseconds(1000);

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
            }

            if (!run) {
                break;
            }

            // Perform other periodic tasks
            auto now = std::chrono::steady_clock::now();
            auto timeDiff = now - tasksLastRan;
            if (timeDiff >= timeout) {
                tasksLastRan = now;

                // Check for new video config
                auto config = videoConfig->getConfig();
                if (config) {
                    // copy video config into dynamically allocated
                    // object that the JS blocking call will free
                    // later.
                    auto copy = std::make_unique<botlink::Public::VideoConfig>(config.value());
                    napi_status status = fn.BlockingCall(copy.release(), callbackVideo);
                    if (status != napi_ok)
                    {
                        // Handle error
                        break;
                    }
                }

                bool connectedNow = conn.isConnected();
                if (connectedNow != connected) {
                    // emit "connectionStatus" event
                    auto copy = std::make_unique<bool>(connectedNow);
                    napi_status status = fn.BlockingCall(copy.release(), callbackConnectionStatus);
                    if (status != napi_ok)
                    {
                        break;
                    }
                }
                connected = connectedNow;
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
    // No race here because this function is always called from
    // node.js's main thread and the finalizer for the threadsafe
    // function (which also calls join()) is called from node.js's
    // main thread
    if (_workerThread.joinable()) {
        _workerThread.join();
    }

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
        // Uncomment following for debugging.
        // TODO(cgrahn): Do not use std::cout. It causes a crash on
        // Windows with "yarn dev" and is frustrating to debug. Need
        // to figure out why.
        // printf("Forwarding RTP packet over UDP\n");

        if (forwarder.getPort() == 0) {
            // The video port hasn't been set yet. So do nothing.
            return;
        }

        if (!forwarder.forward(packet, static_cast<int>(length))) {
            fprintf(stderr, "Error sending RTP packet over UDP\n");
        }
    };

    _conn->addVideoTrack(callback);
    _conn->onVideoConfigReply([config = _videoConfig]
                              (const botlink::Public::VideoConfig& newConfig)
                              { config->setConfig(newConfig); });

    return Napi::Boolean::New(env, true);
}

Napi::Value XrdConnection::setVideoForwardPort(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    if (!(info.Length() == 1 && info[0].IsNumber())) {
        Napi::TypeError::New(env, "Wrong number of arguments. "
                             "Need one argument that is a number.")
            .ThrowAsJavaScriptException();
    }

    _videoForwarder.setPort(info[0].As<Napi::Number>().Int32Value());

    return Napi::Boolean::New(env, true);
}

Napi::Value XrdConnection::setVideoConfig(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    if (!(info.Length() == 1 && info[0].IsObject())) {
        Napi::TypeError::New(env, "Wrong number of arguments. "
                             "Expected XrdVideoConfig object.")
            .ThrowAsJavaScriptException();
    }

    Public::VideoConfig config;

    try {
        const auto videoConfig = info[0].As<Napi::Object>();

        const std::string resolution = videoConfig.Get("resolution").As<Napi::String>();
        const auto resolutionInt = resolutionStringToInt(resolution);
        config.width = resolutionInt.first;
        config.height = resolutionInt.second;
        config.framerate = videoConfig.Get("framerate").As<Napi::Number>().Int32Value();

        // The strings we check here must match XrdVideoCodec in binding.ts
        const std::string codec = videoConfig.Get("codec").As<Napi::String>();
        if (codec == "H264") {
            config.codec = Public::VideoCodec::H264;
        } else if (codec == "H265") {
            config.codec = Public::VideoCodec::H265;
        } else {
            config.codec = Public::VideoCodec::Unknown;
        }
    } catch (const Napi::Error& error) {
        Napi::Error::New(env, "Got exception parsing XrdVideoConfig object: " +
                         error.Message())
            .ThrowAsJavaScriptException();
    }

    bool result = _conn->setVideoConfig(config);
    // TODO(cgrahn): Need an event that indicates XRD changed video settings

    return Napi::Boolean::New(env, result);
}

}
}

namespace {

// TODO(cgrahn): The resolution mapping done by the two functions here could be
// moved to the C++ SDK.

// The values used in this function must match XrdVideoResolution in binding.ts
std::pair<int, int> resolutionStringToInt(const std::string& resolution)
{
    int width = 0;
    int height = 0;
    if (resolution == "144") {
        width = 256;
        height = 144;
    } else if (resolution == "240") {
        width = 426;
        height = 240;
    } else if (resolution == "360") {
        width = 640;
        height = 360;
    } else if (resolution == "480") {
        width = 854;
        height = 480;
    } else if (resolution == "720") {
        width = 1280;
        height = 720;
    } else if (resolution == "1080") {
        width = 1920;
        height = 1080;
    } else if (resolution == "4k") {
        width = 3840;
        height = 2160;
    }

    return { width, height };
}

// The values used in this function must match XrdVideoResolution in binding.ts
std::string resolutionIntToString(const int width, const int height)
{
    std::string resolution = "Unsupported";
    if ((width == 256) && (height == 144)) {
        resolution = "144";
    } else if ((width == 426) && (height == 240)) {
        resolution = "240";
    } else if ((width == 640) && (height == 360)) {
        resolution = "360";
    } else if ((width == 854) && (height == 480)) {
        resolution = "480";
    } else if ((width == 1280) && (height == 720)) {
        resolution = "720";
    } else if ((width == 1920) && (height == 1080)) {
        resolution = "1080";
    } else if ((width == 3840) && (height == 2160)) {
        resolution = "4k";
    }
    return resolution;
}

}
