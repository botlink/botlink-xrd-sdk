var botlink = require('../../../dist/src/napi/lib/binding.js')

let sendPeriodic = (conn) => {
  console.log('sending autopilot message')
  let msg = new Uint8Array([0, 1, 2, 3, 4])
  conn.sendAutopilotMessage(msg)
}

let closeConnection = (conn, sendInterval) => {
  // Stop sending
  clearInterval(sendInterval)

  console.log('closing connection')
  conn.closeConnection()
  console.log('closed connection')
}

async function login(api, username, password) {
  try {
    await api.login({username, password})
  } catch (err) {
    console.log(`log in failed due to ${err}`)
    return
  }
  console.log('logged in')
}

async function connect(api) {
  try {
    let xrds = await api.listXrds()
    // Connect to first XRD in the list
    console.log(`connecting to XRD ${JSON.stringify(xrds[0])}`)

    // Uncomment the following two statements to log autopilot
    // messages. Be sure to update the path argument to XrdLogger.
    // let logger = new botlink.XrdLogger("/tmp/xrd_test.log")
    // let conn = new botlink.XrdConnection(api, xrds[0], logger)

    // Comment this out if using connection with logger
    let conn = new botlink.XrdConnection(api, xrds[0])

    conn.addVideoTrack()
    conn.setVideoForwardPort(61003)
    let connected = await conn.openConnection(30)
    if (connected) {
      console.log(`connected to XRD ${JSON.stringify(xrds[0])}`)

      conn.on('autopilotMessage', (msg) => {
        console.log(`Got autopilot message, length ${msg.length}`)})
      conn.on('videoConfig', (config) => {
        console.log(`Got videoConfig reply ${JSON.stringify(config)}`)})
      conn.on('connectionStatus', (status) => {
        console.log(`Got connectionStatus: ${status}`)})

      conn.setVideoConfig({resolution: '480', framerate: 30, codec: 'H265'})

      // Send an autopilot message every 5 seconds
      let sendInterval = setInterval(sendPeriodic, 5000, conn)
      // Close the conection after 20 seconds
      setTimeout(closeConnection, 20000, conn, sendInterval)
    }
  } catch (err) {
    console.log(`failed to connect to xrd due to ${err}`)
  }
}

async function main() {
  let api = new botlink.BotlinkApi()

  if (process.argv.length === 3) {
    // script called directly, e.g., "/path/to/test.js"
    await login(api, process.argv[1], process.argv[2])
    connect(api)
  } else if (process.argv.length === 4) {
    // script called with node, e.g., "/usr/bin/node /path/to/test.js"
    await login(api, process.argv[2], process.argv[3])
    connect(api)
  } else {
    console.log('Need to be called with username and password')
  }
}

main()
