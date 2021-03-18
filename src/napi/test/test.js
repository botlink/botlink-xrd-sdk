var botlink = require('../lib/binding.js')

let api = new botlink.Api()

let startSend = (conn) => {
    setTimeout(sendPeriodic, 5000, conn)
}

let sendPeriodic = (conn) => {
    console.log('sending')
    let msg = new Uint8Array([0, 1, 2, 3, 4])
    conn.sendAutopilotMessage(msg)
    setTimeout(sendPeriodic, 1000, conn)
}

async function login(username, password) {
    try {
        await api.login(username, password)
    } catch (err) {
        console.log(`log in failed due to ${err}`)
        return
    }
    console.log('logged in')
    connect(api)
}

async function connect(api) {
    try {
        let x = await api.listXrds()
        console.log(`connecting to XRD ${x[0][0]}`)
        let conn = new botlink.XrdConnection(api, x[0][0])
	conn.addVideoTrack()
	conn.setVideoPortInternal(61003)
        let connected = await conn.openConnection(30)
        if (connected) {
            conn.startEmitter()
            console.log(`connected to XRD ${x[0][0]}`)
            conn.on('data', (msg) => {
                console.log(`Callback got msg, length ${msg.length}`)})
            startSend(conn)
        }
    } catch (err) {
        console.log(`failed to connect to xrd due to ${err}`)
    }
}

if (process.argv.length === 3) {
    // script called directly, e.g., "/path/to/test.js"
    login(process.argv[1], process.argv[2])
} else if (process.argv.length === 4) {
    // scripted called with node, e.g., "/usr/bin/node /path/to/test.js"
    login(process.argv[2], process.argv[3])
} else {
    console.log('Need to be called with username and password')
}
