/**
Copyright 2019 Botlink, LLC.

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

require('dotenv').config()
const net = require('net')
const { XRDSocket, BotlinkApi, XrdConnection, XrdLogger } = require('botlink-xrd-sdk')
const { pipeline } = require('stream')

var currentSocket;
var server;

const destroy = () => {
  if (currentSocket) {
    console.log('[DESTROY] Connection from ', currentSocket.remoteAddress)
    currentSocket.removeAllListeners()
    currentSocket.end()
    currentSocket = null
  }
}

const handleSocket = async (relay, tcpSocket) => {
  if (currentSocket) {
    console.error('[REJECT] There is already a connection active from ', currentSocket.remoteAddress)
    socket.end()
    return
  }

  console.log('[ACCEPT] Connection from ', tcpSocket.remoteAddress)

  currentSocket = tcpSocket

  console.log('[INFO] Authenticating as ', relay.xrd.username)

  currentSocket.on('close', () => {
    destroy()
  })

  let botlinkApi = new BotlinkApi()

  try {
    await botlinkApi.login({'username': relay.xrd.username, 'password': relay.xrd.password})
  } catch (error) {
    console.error('Unable to authenticate with botlink services', error)
    destroy()
    return
  }

  console.log('[INFO] Successfully authenticated with as ', relay.xrd.username)

  let xrds

  try {
    xrds = await botlinkApi.listXrds()
  } catch (error) {
    console.error('Unable to list XRDs', error)
    destroy()
    return
  }

  let selectedXrd = xrds.find((xrd) => {
    return xrd.hardwareId === relay.xrd.hardwareId
  })

  if (!selectedXrd) {
    console.error('Unable to find the XRD specified')
    destroy()
    return
  }

  console.log('[INFO] Connecting to XRD ', selectedXrd.name || selectedXrd.emei, '(', selectedXrd.hardwareId, ')')

  const refreshToken = await botlinkApi.getRefreshToken()
  const accessToken = await botlinkApi.getAuthToken()

  const xrdSocket = new XRDSocket({
    xrd: selectedXrd,
    credentials: { 
        token: accessToken,
        refresh: refreshToken,
        user: { id: -1 }
    }
  })

  xrdSocket.on('disconnect', () => {
    console.log('[INFO] Reconnecting to XRD ', selectedXrd.name || selectedXrd.emei, '(', selectedXrd.hardwareId, ')')
  })

  xrdSocket.connect(() => {
    pipeline(currentSocket, xrdSocket, (err) => {
      if (err) {
        console.error(err)
      }

      destroy()
    })

    pipeline(xrdSocket, currentSocket, (err) => {
      if (err) {
        console.error(err)
      }

      destroy()
    })

    console.log('[INFO] Connected to XRD ', selectedXrd.name || selectedXrd.emei, '(', selectedXrd.hardwareId, ')')
  })
}


const port = process.env.PORT || 5760;
const bindAddr = process.env.BINDADDR || '127.0.0.1';

(async () => {
  const relay = {
    xrd: {
      hardwareId: process.env.RELAY_XRD_HARDWARE_ID,
      username: process.env.RELAY_XRD_EMAIL,
      password: process.env.RELAY_XRD_PASSWORD
    }
  }

  server = net.createServer(async (socket) => {
    await handleSocket(relay, socket)
  })

  server.listen(port, bindAddr)
  console.log(`Listening on TCP ${bindAddr}:${port}.`);
})().catch((error => {
  console.error('[ERROR] ', error)

  if (server) {
    server.close()
  }
}))
