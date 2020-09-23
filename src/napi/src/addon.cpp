#include <napi.h>
#include "wrtc_wrapper.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    return botlink::wrapper::Wrtc::Init(env, exports);
}

NODE_API_MODULE(addon, InitAll)
