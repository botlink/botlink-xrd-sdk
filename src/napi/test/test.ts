import { BotlinkApi, XrdConnection } from '../lib/binding'
import { ApiBindings, XrdConnectionBindings } from '../lib/binding'
import { ApiLoginUsername, ApiLoginToken } from '../lib/binding'
import { XrdConnectionEvents, XrdVideoCodec, XrdVideoConfig } from '../lib/binding'
import { XrdVideoResolution } from '../lib/binding'
import { BotlinkApiEvents } from '../lib/binding'

let sendPeriodic = (conn: XrdConnectionBindings) => {
  console.log('sending autopilot message')
  let msg = new Buffer([0, 1, 2, 3, 4])
  conn.sendAutopilotMessage(msg)
}

let closeConnection = (conn: XrdConnectionBindings,
  sendInterval: ReturnType<typeof setInterval>) => {
  // Stop sending
  clearInterval(sendInterval)

  console.log('closing connection')
  conn.closeConnection()
  console.log('closed connection')
}

async function login(api: ApiBindings, username: string, password: string) {
  try {
    // log in with username
    const usernamePassword: ApiLoginUsername = { username, password }
    await api.login(usernamePassword)

    // get token
    const refreshToken = await api.getRefreshToken()

    // log in with token
    const tokenLogin: ApiLoginToken = { token: refreshToken }
    await api.login(tokenLogin)

  } catch (err) {
    console.log(`log in failed due to ${err}`)
    return
  }
  console.log('logged in')
}

async function connect(api: ApiBindings) {
  try {
    let xrds = await api.listXrds()
    console.log(`connecting to XRD ${JSON.stringify(xrds[0])}`)
    let conn = new XrdConnection(api, xrds[0])
    conn.addVideoTrack()
    conn.setVideoForwardPort(61003)
    let connected = await conn.openConnection(30)
    if (connected) {
      //conn.startEmitter()
      console.log(`connected to XRD ${JSON.stringify(xrds[0])}`)

      conn.on(XrdConnectionEvents.AutopilotMessage, (msg) => {
        console.log(`Callback got msg, length ${msg.length}`)
      })
      conn.on(XrdConnectionEvents.VideoConfig, (config) => {
        console.log(`Got video config reply ${JSON.stringify(config)}`)
      })
      conn.on(XrdConnectionEvents.ConnectionStatus, (status) => {
        console.log(`Got connectionStatus: ${status}`)
      })

      const videoConfig: XrdVideoConfig = {
        resolution: XrdVideoResolution.Resolution_480,
        framerate: 30, codec: XrdVideoCodec.H265
      }
      conn.setVideoConfig(videoConfig)

      let sendInterval = setInterval(sendPeriodic, 5000, conn)
      // Close the conection after 20 seconds
      setTimeout(closeConnection, 20000, conn, sendInterval)
    }
  } catch (err) {
    console.log(`failed to connect to xrd due to ${err}`)
  }
}

async function main() {
  let api = new BotlinkApi()
  api.on(BotlinkApiEvents.NewTokens, ({ auth, refresh }) => {
    console.log(`Got auth token: ${auth}`)
    console.log(`Got refresh token: ${refresh}`)
  })

  if (process.argv.length === 3) {
    // script called directly, e.g., "/path/to/test.js"
    await login(api, process.argv[1], process.argv[2])
    connect(api)
  } else if (process.argv.length === 4) {
    // scripted called with node, e.g., "/usr/bin/node /path/to/test.js"
    await login(api, process.argv[2], process.argv[3])
    connect(api)
  } else {
    console.log('Need to be called with username and password')
  }
}

main()
