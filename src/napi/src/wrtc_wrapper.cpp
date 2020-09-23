#include "wrtc_wrapper.h"

#include <napi.h>

namespace botlink {
namespace wrapper {

Napi::Object Wrtc::Init(Napi::Env env, Napi::Object exports)
{
    Napi::Function func =
        DefineClass(env,
                    "Wrtc",
                    {InstanceMethod("openConnection", &Wrtc::openConnection),
                     InstanceMethod("getAutopilotMessage", &Wrtc::getAutopilotMessage)});

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
    if (info.Length() != 1) {
        Napi::TypeError::New(env, "Wrong number of arguments")
            .ThrowAsJavaScriptException();
    }

    if (!info[0].IsString()) {
        Napi::TypeError::New(env, "Wrong argument. Expected string.")
            .ThrowAsJavaScriptException();
    }

    std::string config = info[0].As<Napi::String>();

    bool success = _wrtc.openConnection(config);

    return Napi::Boolean::New(env, success);
}

Napi::Value Wrtc::getAutopilotMessage(const Napi::CallbackInfo& info)
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

    std::vector<uint8_t> msg = _wrtc.getAutopilotMessage(block);

    Napi::Buffer<uint8_t> obj = Napi::Buffer<uint8_t>::Copy(env, &msg[0], msg.size());

    return obj;
}

}
}
