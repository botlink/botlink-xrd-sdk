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
const { BotlinkApi, XrdConnection, XrdConnectionEvents, XrdConnectionStatus } = require('botlink-xrd-sdk')

var server;

const handleSocket = async (tcpSocket, xrdConnection) => {

  const destroy = () => {
    if (tcpSocket) {
      console.log('[DESTROY] Connection from ', tcpSocket.remoteAddress)
      tcpSocket.removeAllListeners()
      tcpSocket.end()
      tcpSocket = null
    }
  }

  console.log('[ACCEPT] Connection from ', tcpSocket.remoteAddress)


  tcpSocket.on('close', () => {
    destroy()
    return
  })

  xrdConnection.on(XrdConnectionEvents.AutopilotMessage, xrdData => {
    if ( !tcpSocket) {
      return
    }
    try{
      tcpSocket.write(xrdData)
    } catch(error) {
      console.log(`error on autopilot message ${error}`)
    }
  })

  tcpSocket.on('data', gcsData => {
    xrdConnection.sendAutopilotMessage(gcsData)
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

  console.log('[INFO] Authenticating as ', relay.xrd.username)
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
    return
  }

  let selectedXrd = xrds.find((xrd) => {
    return xrd.hardwareId === relay.xrd.hardwareId
  })

  if (!selectedXrd) {
    console.error('Unable to find the XRD specified')
    return
  }

  let xrdName = selectedXrd.name || selectedXrd.emei

  xrdConnection = new XrdConnection(botlinkApi, selectedXrd)

  xrdConnection.on(XrdConnectionEvents.ConnectionStatus, (status) => {
    if (status === XrdConnectionStatus.Connected) {
      console.log(`[INFO] Connected to XRD ${xrdName}, (${selectedXrd.hardwareId})`)
    } else
    if (status === XrdConnectionStatus.Connecting) {
      console.log(`[INFO] Connecting to XRD ${xrdName}, (${selectedXrd.hardwareId})`)
    } else if (status === XrdConnectionStatus.Disconnected) {
      console.log(`[INFO] Disconnected from XRD ${xrdName}, (${selectedXrd.hardwareId})`)
    }
  })
  xrdConnection.openConnection(60)

  server = net.createServer(async (socket) => {
    await handleSocket(socket, xrdConnection)
  })

  server.listen(port, bindAddr)
  console.log(`Listening on TCP ${bindAddr}:${port}.`);
})().catch((error => {
  console.error('[ERROR] ', error)

  if (server) {
    server.close()
  }
}))
