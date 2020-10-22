const wrtc = require('bindings')('botlink_wrtc_node');
const EventEmitter = require('events')
const inherits = require('util').inherits

inherits(wrtc.Wrtc, EventEmitter)

class Wrtc extends wrtc.Wrtc {
    constructor() {
        super()
    }

    send(msg) {
        return this.sendUnreliableMessage(msg)
    }
}

module.exports.Wrtc = Wrtc
