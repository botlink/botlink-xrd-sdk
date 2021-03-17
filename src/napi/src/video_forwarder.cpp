#include "video_forwarder.h"

#include <iostream>

#include <unistd.h>

namespace botlink {
namespace video {

Forwarder::Forwarder()
: _fd(-1)
{
}

Forwarder::~Forwarder()
{
    if (_fd > -1) {
        close(_fd);
    }
}

bool Forwarder::init()
{
    int sockfd = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    if (sockfd == -1) {
        std::cerr << "Failed to create UDP socket\n";
        return false;
    }

    std::lock_guard<std::mutex> lock(_mutex);

    _fd = sockfd;

    _sockaddr.sin_family = AF_INET;
    _sockaddr.sin_port = htons(0);

    if (inet_aton("127.0.0.1", &_sockaddr.sin_addr) == 0) {
        std::cerr << "Failed to set address for UDP socket\n";
        return false;
    }

    return true;
}

void Forwarder::setPort(int port)
{
    std::lock_guard<std::mutex> lock(_mutex);
    _sockaddr.sin_port = htons(port);
}

int Forwarder::getPort() const
{
    int port;
    {
        std::lock_guard<std::mutex> lock(_mutex);
        port = _sockaddr.sin_port;
    }

    return ntohs(port);
}

bool Forwarder::forward(uint8_t* data, size_t length)
{
    std::lock_guard<std::mutex> lock(_mutex);
    if (sendto(_fd, data, length,
               0, (const struct sockaddr *) &_sockaddr,
               sizeof(_sockaddr)) == -1) {
        return false;
    }

    return true;
}

}
}
