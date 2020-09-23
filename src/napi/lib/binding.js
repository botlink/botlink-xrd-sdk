var wrtc = require('bindings')('botlink_wrtc_js');
const EventEmitter = require('events')

class Wrtc extends EventEmitter {
    constructor() {
        super()
        this.wrtc = new wrtc.Wrtc()
    }

    openConnection(config) {
        this.wrtc.openConnection(config)
    }

    run() {
        // horrible hack until EventEmitter gets implemented at the C++ level in
        // botlink_wrtc_js
        // Get message without blocking
        let msg = this.wrtc.getAutopilotMessage(false)
        if (msg.length === 0) {
            // run again in 10ms
            setTimeout(this.run.bind(this), 10)
        } else {
            // This might get behind?
            this.emit('data', msg)
            // Run again as soon as possible
            setTimeout(this.run.bind(this), 0)
        }
    }
}

module.exports.Wrtc = Wrtc
