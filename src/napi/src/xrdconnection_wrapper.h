#ifndef BOTLINK_XRD_CONNECTION_WRAPPER_H
#define BOTLINK_XRD_CONNECTION_WRAPPER_H

#include <napi.h>
#include <botlink/api.h>

#include <memory>
#include <thread>

namespace botlink {
namespace wrapper {

class XrdConnection : public Napi::ObjectWrap<XrdConnection> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    XrdConnection(const Napi::CallbackInfo& info);

    Napi::Value openConnection(const Napi::CallbackInfo& info);
    Napi::Value closeConnection(const Napi::CallbackInfo& info);
    Napi::Value isConnected(const Napi::CallbackInfo& info);

    Napi::Value getAutopilotMessage(const Napi::CallbackInfo& info);
    Napi::Value sendAutopilotMessage(const Napi::CallbackInfo& info);

    // TODO(cgrahn): Rename to startPump? or startEmitter?
    Napi::Value start(const Napi::CallbackInfo& info);

private:
    Napi::ObjectReference _api;
    std::unique_ptr<botlink::Public::XrdConnection> _conn;
    std::thread _workerThread;
    Napi::ThreadSafeFunction _workerFn;
};

}
}

#endif