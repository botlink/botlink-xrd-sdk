#ifndef BOTLINK_WRTC_WRAPPER_H
#define BOTLINK_WRTC_WRAPPER_H

#include <napi.h>
#include <_internal/wrtc.h>

#include <thread>

namespace botlink {
namespace wrapper {

class Wrtc : public Napi::ObjectWrap<Wrtc> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    Wrtc(const Napi::CallbackInfo& info);

    Napi::Value openConnection(const Napi::CallbackInfo& info);
    Napi::Value closeConnection(const Napi::CallbackInfo& info);
    Napi::Value isConnected(const Napi::CallbackInfo& info);

    Napi::Value getUnreliableMessage(const Napi::CallbackInfo& info);
    Napi::Value sendUnreliableMessage(const Napi::CallbackInfo& info);

    Napi::Value start(const Napi::CallbackInfo& info);

private:
    botlink::wrtc::Wrtc _wrtc;
    std::thread _workerThread;
    Napi::ThreadSafeFunction _workerFn;
};

}
}

#endif
