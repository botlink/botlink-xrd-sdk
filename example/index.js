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
const fs = require('fs')
const tls = require('tls')
const { auth, XRDApi, XRDSocket } = require('botlink-xrd-sdk')
const { C3, API } = require('botlink-xrd-sdk/dist/src/urls')
const { pipeline } = require('stream')

var currentSocket;
var client;
var server;

console.log(`C3 URL - ${C3}`)
console.log(`API URL - ${API}`)

const destroy = () => {
  if (currentSocket) {
    console.log('[DESTROY] Connection from ', currentSocket.remoteAddress)
    currentSocket.removeAllListeners()
    currentSocket.end()
    currentSocket = null
  }

  if (client) {
    client.removeAllListeners()
    client.close()
    client = null
  }
}

const handleSocket = async (relay, socket) => {
  if (currentSocket) {
    console.error('[REJECT] There is already a connection active from ', currentSocket.remoteAddress)
    socket.end()
    return
  }

  console.log('[ACCEPT] Connection from ', socket.remoteAddress)

  currentSocket = socket

  console.log('[INFO] Authenticating with ', API, ' as ', relay.xrd.email)

  currentSocket.on('close', () => {
    destroy()
  })

  let credentials;

  try {
    credentials = await auth(relay.xrd.email, relay.xrd.password)
  } catch (error) {
    console.error('Unable to authenticate with botlink services', error)
    destroy()
    return
  }

  console.log('[INFO] Successfully authenticated with ', API, ' as ', relay.xrd.email)

  const api = new XRDApi(credentials)

  let xrds

  try {
    xrds = await api.list()
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

  const xrdSocket = new XRDSocket({
    xrd: selectedXrd,
    credentials: credentials
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

(async () => {
  const relay = {
    xrd: {
      hardwareId: process.env.RELAY_XRD_HARDWARE_ID,
      email: process.env.RELAY_XRD_EMAIL,
      password: process.env.RELAY_XRD_PASSWORD
    }
  }

  server = net.createServer(async (socket) => {
    await handleSocket(relay, socket)
  })

  server.listen(process.env.PORT || 5760)
})().catch((error => {
  console.error('[ERROR] ', error)

  if (server) {
    server.close()
  }
}))