#ifndef BOTLINK_BOTLINK_API_WRAPPER_H
#define BOTLINK_BOTLINK_API_WRAPPER_H

#include <napi.h>
#include <public/api.h>

namespace botlink {
namespace wrapper {

class BotlinkApi : public Napi::ObjectWrap<BotlinkApi> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    BotlinkApi(const Napi::CallbackInfo& info);

    Napi::Value login(const Napi::CallbackInfo& info);
    Napi::Value refresh(const Napi::CallbackInfo& info);
    Napi::Value listXrds(const Napi::CallbackInfo& info);

    // Used by botlink::wrapper::XrdConnection, not exposed in
    // javascript. XrdConnection holds a Napi object reference to this
    // object. So we don't have to worry about a dangling reference
    // created by a call to this function.
    botlink::Public::BotlinkApi& getApi();

private:
    botlink::Public::BotlinkApi _api;
};

}
}

#endif
