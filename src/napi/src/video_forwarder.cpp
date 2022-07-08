#include "video_forwarder.h"

#ifdef _WIN32
#include <ws2tcpip.h>
#else
#include <unistd.h>
#endif

namespace botlink {
namespace video {

Forwarder::Forwarder()
#ifdef _WIN32
: _fd(INVALID_SOCKET)
#else
: _fd(-1)
#endif
{
}

Forwarder::~Forwarder()
{
#ifdef _WIN32
    if (_fd != INVALID_SOCKET) {
        closesocket(_fd);
    }
    WSACleanup();
#else
    if (_fd > -1) {
        close(_fd);
    }
#endif
}

bool Forwarder::init()
{
#ifdef _WIN32
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != NO_ERROR) {
        // TODO(cgrahn): Get error
        fprintf(stderr, "WSAStartup() failed\n");
        return false;
    }

    SOCKET sockfd = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (sockfd == INVALID_SOCKET) {
#else
    int sockfd = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (sockfd == -1) {
#endif
        fprintf(stderr, "Failed to create UDP socket for video forwarder\n");
        return false;
    }

    std::lock_guard<std::mutex> lock(_mutex);

    _fd = sockfd;

    _sockaddr.sin_family = AF_INET;
    _sockaddr.sin_port = htons(0);

    if (inet_pton(AF_INET, "127.0.0.1", &_sockaddr.sin_addr) == 0) {
        fprintf(stderr, "Failed to set address for UDP socket\n");
        return false;
    }

    return true;
}

void Forwarder::setPort(int port)
{
    std::lock_guard<std::mutex> lock(_mutex);
    (void)port;
    _sockaddr.sin_port = htons(static_cast<unsigned short>(port));
}

int Forwarder::getPort() const
{
    int port;
    {
        std::lock_guard<std::mutex> lock(_mutex);
        port = _sockaddr.sin_port;
    }

    return ntohs(static_cast<unsigned short>(port));
}

bool Forwarder::forward(const uint8_t* data, int length)
{
    std::lock_guard<std::mutex> lock(_mutex);
    if (sendto(_fd, reinterpret_cast<const char*>(data), length,
               0, (const struct sockaddr *) &_sockaddr,
               sizeof(_sockaddr)) == -1) {
        return false;
    }

    return true;
}

}
}
