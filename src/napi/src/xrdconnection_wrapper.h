#ifndef BOTLINK_XRD_CONNECTION_WRAPPER_H
#define BOTLINK_XRD_CONNECTION_WRAPPER_H

#include <napi.h>
#include <botlink/api.h>

#include <atomic>
#include <memory>
#include <optional>
#include <thread>

#include "video_forwarder.h"

namespace botlink {
namespace wrapper {

class VideoConfigThreadsafe {
public:
    void setConfig(const botlink::Public::VideoConfig& config);
    std::optional<botlink::Public::VideoConfig> getConfig();

private:
    std::optional<botlink::Public::VideoConfig> _config;
    std::mutex _mutex;
};

class XrdConnection : public Napi::ObjectWrap<XrdConnection> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    XrdConnection(const Napi::CallbackInfo& info);

    Napi::Value openConnection(const Napi::CallbackInfo& info);
    Napi::Value closeConnection(const Napi::CallbackInfo& info);
    Napi::Value getConnectionStatus(const Napi::CallbackInfo& info);

    Napi::Value getAutopilotMessage(const Napi::CallbackInfo& info);
    Napi::Value sendAutopilotMessage(const Napi::CallbackInfo& info);

    Napi::Value addVideoTrack(const Napi::CallbackInfo& info);
    Napi::Value setVideoForwardPort(const Napi::CallbackInfo& info);
    Napi::Value setVideoConfig(const Napi::CallbackInfo& info);
    Napi::Value pauseVideo(const Napi::CallbackInfo& info);
    Napi::Value resumeVideo(const Napi::CallbackInfo& info);
    Napi::Value saveLogs(const Napi::CallbackInfo& info);

    Napi::Value pingXrd(const Napi::CallbackInfo& info);

private:
    Napi::ObjectReference _api;
    Napi::ObjectReference _logger;
    botlink::video::Forwarder _videoForwarder;
    std::unique_ptr<botlink::Public::XrdConnection> _conn;
    std::thread _workerThread;
    std::atomic<bool> _runWorkerThread;
    std::atomic<bool> _cancelConnectionAttempt;
    std::shared_ptr<VideoConfigThreadsafe> _videoConfig;

    Napi::Value startEmitter(const Napi::CallbackInfo& info);
    Napi::Value stopEmitter(const Napi::CallbackInfo& info);
};

}
}

#endif
