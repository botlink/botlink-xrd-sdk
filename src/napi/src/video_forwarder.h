#ifndef BOTLINK_XRD_VIDEO_FORWARDER_H
#define BOTLINK_XRD_VIDEO_FORWARDER_H

#include <mutex>

#ifdef _WIN32
#define _WINSOCK_DEPRECATED_NO_WARNINGS
#include <Winsock2.h>
#else
#include <netinet/in.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#endif

namespace botlink {
namespace video {

class Forwarder {
public:
    Forwarder();
    virtual ~Forwarder();

    bool init();

    void setPort(int port);
    int getPort() const;

    void setAddr(const char* addr);
    char* getAddr() const;

    bool forward(const uint8_t* data, int length);

private:
#ifdef _WIN32
    SOCKET _fd;
#else
    int _fd;
#endif
    sockaddr_in _sockaddr;
    mutable std::mutex _mutex;
};

}
}

#endif
