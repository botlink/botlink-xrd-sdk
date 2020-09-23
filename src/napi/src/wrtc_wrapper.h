#ifndef BOTLINK_WRTC_WRAPPER_H
#define BOTLINK_WRTC_WRAPPER_H

#include <napi.h>
#include <wrtc.h>

namespace botlink {
namespace wrapper {

class Wrtc : public Napi::ObjectWrap<Wrtc> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    Wrtc(const Napi::CallbackInfo& info);

    Napi::Value openConnection(const Napi::CallbackInfo& info);

    Napi::Value getAutopilotMessage(const Napi::CallbackInfo& info);

private:
    botlink::wrtc::Wrtc _wrtc;
};

}
}

#endif
