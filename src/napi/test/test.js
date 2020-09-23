var wrtc = require('../lib/binding.js')

const config = `{
    "ttl": "86400",
    "iceServers": [
        {
            "urls": "stun:global.stun.twilio.com:3478?transport=udp",
            "url": "stun:global.stun.twilio.com:3478?transport=udp"
        }
    ],
    "dateUpdated": "2020-09-18T18:51:40.000Z",
    "dateCreated": "2020-09-18T18:51:40.000Z",
}
`;

let obj = new wrtc.Wrtc()

obj.openConnection(config)

obj.on('data', (msg) => {
    console.log(`Callback got msg, length ${msg.length}`)})

obj.run()
