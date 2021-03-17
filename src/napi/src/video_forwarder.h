#ifndef BOTLINK_XRD_VIDEO_FORWARDER_H
#define BOTLINK_XRD_VIDEO_FORWARDER_H

#include <mutex>

#include <arpa/inet.h>
#include <sys/socket.h>

namespace botlink {
namespace video {

class Forwarder {
public:
    Forwarder();
    virtual ~Forwarder();

    bool init();

    void setPort(int port);
    int getPort() const;

    bool forward(uint8_t* data, size_t length);

private:
    int _fd;
    sockaddr_in _sockaddr;
    mutable std::mutex _mutex;
};

}
}

#endif
