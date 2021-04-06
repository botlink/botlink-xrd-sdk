#include <napi.h>
#include "botlink_api_wrapper.h"
#include "logger_wrapper.h"
#include "xrdconnection_wrapper.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    exports = botlink::wrapper::BotlinkApi::Init(env, exports);
    exports = botlink::wrapper::XrdLogger::Init(env, exports);
    return botlink::wrapper::XrdConnection::Init(env, exports);
}

NODE_API_MODULE(addon, InitAll)
