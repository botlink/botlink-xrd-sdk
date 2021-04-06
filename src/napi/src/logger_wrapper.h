#ifndef BOTLINK_XRD_LOGGER_WRAPPER_H
#define BOTLINK_XRD_LOGGER_WRAPPER_H

#include <napi.h>
#include <botlink/unsupported.h>

#include <memory>

namespace botlink {
namespace wrapper {

/**
 * @brief A class that wraps BinaryLogger from the C++ SDK to allow
 *        logging from JavaScript
 */
class XrdLogger : public Napi::ObjectWrap<XrdLogger> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    /**
     * @brief Constructor for XrdLogger
     *
     * @note Each instance of XrdLogger should be created with a
     *       unique log file path. Otherwise behavior is undefined.
     *
     * @param info Arguments from JavaScript. This should contain one
     *        string argument which is the path for the log file to
     *        use.
     */
    XrdLogger(const Napi::CallbackInfo& info);

    // For use from JavaScript
    Napi::Value logMessage(const Napi::CallbackInfo& info);
    // For use from C++
    void logMessage(uint8_t source, const std::vector<uint8_t>& message);

private:
    std::unique_ptr<botlink::unsupported::BinaryLogger> _logger;
};

}
}

#endif
