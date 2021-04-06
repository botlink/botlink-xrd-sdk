#include "logger_wrapper.h"

#include <functional>
#include <string>

namespace botlink {
namespace wrapper {

Napi::Object XrdLogger::Init(Napi::Env env, Napi::Object exports)
{
    Napi::Function func =
        DefineClass(env,
                    "XrdLogger",
                    {InstanceMethod("logMessage", &XrdLogger::logMessage)});

    Napi::FunctionReference* constructor = new Napi::FunctionReference;
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);

    exports.Set("XrdLogger", func);
    return exports;
}

XrdLogger::XrdLogger(const Napi::CallbackInfo& info)
: Napi::ObjectWrap<XrdLogger>(info)
{
    Napi::Env env = info.Env();
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Wrong number of arguments. "
                             "Need path for log file.")
            .ThrowAsJavaScriptException();
    }

    const auto& pathJs = info[0];
    if (!pathJs.IsString()) {
        Napi::TypeError::New(env, "Wrong argument type for log file. Expected string.")
            .ThrowAsJavaScriptException();
    }

    std::string path = pathJs.As<Napi::String>();

    _logger = std::make_unique<botlink::unsupported::BinaryLogger>(path);
}

Napi::Value XrdLogger::logMessage(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    if (info.Length() != 2) {
        Napi::TypeError::New(env, "Wrong number of arguments")
            .ThrowAsJavaScriptException();
    }

    // TODO(cgrahn): Expose an enum for the source tag?
    const auto& sourceJs = info[0];
    if (!(sourceJs.IsNumber())) {
        Napi::TypeError::New(env, "Wrong argument. Expected a number "
                             "indicating the source of the message "
                             "being logged.")
            .ThrowAsJavaScriptException();
    }

    // This is to match the types that xrdSocket.ts accepts (except String, we
    // only want binary data here).
    const auto& msgJs = info[1];
    if (!(msgJs.IsBuffer() || msgJs.IsTypedArray())) {
        Napi::TypeError::New(env, "Wrong argument. "
                             "Expected Buffer or Uint8Array.")
            .ThrowAsJavaScriptException();
    }

    std::vector<uint8_t> msg;

    if (msgJs.IsBuffer()) {
        auto obj = msgJs.As<Napi::Buffer<uint8_t>>();
        uint8_t* start = obj.Data();
        size_t length = obj.Length();
        msg.insert(msg.end(), start, start + length);
    } else {
        auto obj = msgJs.As<Napi::Uint8Array>();
        uint8_t* start = obj.Data();
        size_t length = obj.ByteLength();
        msg.insert(msg.end(), start, start + length);
    }

    logMessage(static_cast<uint8_t>(sourceJs.As<Napi::Number>().Uint32Value()),
               msg);

    // equivalent to returning void
    return env.Undefined();
}

void XrdLogger::logMessage(uint8_t source, const std::vector<uint8_t>& message)
{
    _logger->queueMessage(source,
                          std::chrono::system_clock::now(),
                          message);
}

}
}
