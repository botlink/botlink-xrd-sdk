#include "wrtc_wrapper.h"

#include <napi.h>

namespace {
const char* prodSignalUrl = "https://botlink-signal-production.herokuapp.com";
// See https://stackoverflow.com/a/59777334
std::string jsonToString(const Napi::Env& env, const Napi::Object& object)
{
  Napi::Object json = env.Global().Get("JSON").As<Napi::Object>();
  Napi::Function stringify = json.Get("stringify").As<Napi::Function>();
  return stringify.Call(json, { object }).As<Napi::String>();
}
}

namespace botlink {
namespace wrapper {

Napi::Object Wrtc::Init(Napi::Env env, Napi::Object exports)
{
    Napi::Function func =
        DefineClass(env,
                    "Wrtc",
                    {InstanceMethod("openConnection", &Wrtc::openConnection),
                     InstanceMethod("closeConnection", &Wrtc::closeConnection),
                     InstanceMethod("getUnreliableMessage", &Wrtc::getUnreliableMessage),
                     InstanceMethod("sendUnreliableMessage", &Wrtc::sendUnreliableMessage)});

    Napi::FunctionReference* constructor = new Napi::FunctionReference;
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);

    exports.Set("Wrtc", func);
    return exports;
}

Wrtc::Wrtc(const Napi::CallbackInfo& info)
: Napi::ObjectWrap<Wrtc>(info)
{
}


Napi::Value Wrtc::openConnection(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    constexpr size_t numArgs = 3;
    if (info.Length() != numArgs) {
        Napi::TypeError::New(env, "Wrong number of arguments")
            .ThrowAsJavaScriptException();
    }

    if (!(info[0].IsString() || info[0].IsObject())) {
        Napi::TypeError::New(env, "Wrong argument for ICE config. Expected string or JSON object.")
            .ThrowAsJavaScriptException();
    }

    if (!info[1].IsString()) {
        Napi::TypeError::New(env, "Wrong argument for token. Expected string.")
            .ThrowAsJavaScriptException();
    }

    if (!info[2].IsString()) {
        Napi::TypeError::New(env, "Wrong argument for XRD hardware ID. Expected string.")
            .ThrowAsJavaScriptException();
    }

    std::string iceConfig;
    if (info[0].IsObject()) {
        iceConfig = jsonToString(env, info[0].As<Napi::Object>());
    } else {
        iceConfig = info[0].As<Napi::String>();
    }

    std::string token = info[1].As<Napi::String>();
    std::string xrdId = info[2].As<Napi::String>();

    // TODO(cgrahn): This can block for a few seconds. Spin off into a separate
    // thread?
    botlink::wrtc::WrtcConfig config;
    config.iceConfig = iceConfig;
    config.token = token;
    config.xrdId = xrdId;
    // TODO(cgrahn): Set url here or pass in from javascript?
    config.signalUrl = prodSignalUrl;
    bool success = _wrtc.openConnection(config);

    return Napi::Boolean::New(env, success);
}

Napi::Value Wrtc::closeConnection(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();

    bool success = _wrtc.closeConnection();

    return Napi::Boolean::New(env, success);
}

Napi::Value Wrtc::getUnreliableMessage(const Napi::CallbackInfo& info)
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

    std::vector<uint8_t> msg = _wrtc.getUnreliableMessage(block);

    // TODO(cgrahn): Something to tie life of vector to buffer. That way we can
    // avoid the copy here.
    Napi::Buffer<uint8_t> obj = Napi::Buffer<uint8_t>::Copy(env, &msg[0], msg.size());

    return obj;
}

Napi::Value Wrtc::sendUnreliableMessage(const Napi::CallbackInfo& info)
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
    // copy in this function.
    bool success = _wrtc.sendUnreliableMessage(msg);

    return Napi::Boolean::New(env, success);
}

}
}
