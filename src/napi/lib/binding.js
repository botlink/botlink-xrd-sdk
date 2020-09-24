var wrtc = require('bindings')('botlink_wrtc_node');
const EventEmitter = require('events')

class Wrtc extends EventEmitter {
    constructor() {
        super()
        this.wrtc = new wrtc.Wrtc()
        this.run_ = false
    }

    openConnection(config) {
        return this.wrtc.openConnection(config)
    }

    closeConnection() {
        return this.wrtc.closeConnection()
    }

    run() {
        this.run_ = true
        // horrible hack until EventEmitter gets implemented at the C++ level in
        // botlink_wrtc_node
        let f = () => {
            if (this.run_) {
                // Get message without blocking
                let msg = this.wrtc.getAutopilotMessage(false)
                if (msg.length === 0) {
                    // run again in 10ms
                    setTimeout(f, 10)
                } else {
                    // This might get behind?
                    this.emit('data', msg)
                    // Run again as soon as possible
                    setTimeout(f, 0)
                }
            }
        }
        f()
    }

    stop() {
        this.run_ = false
    }
}

module.exports.Wrtc = Wrtc
