import io from 'socket.io-client'
import MessageCoder from './message-coder'
import { XRD } from './xrd';
import { Credentials } from './api';
import * as urls from './urls'
import { Duplex } from 'stream';

export interface XRDSocketOptions {
  xrd: XRD,
  credentials: Credentials
}

export class XRDSocket extends Duplex {
  private socket?: SocketIOClient.Socket
  private coder: MessageCoder = new MessageCoder()
  // TODO: Limit internal storage usage
  private token: string 
  readonly xrd: XRD
  bytesRead: number = 0
  bytesWritten: number = 0

  pending: boolean = true
  connecting: boolean = false

  remoteAddress?: string
  private readyForBytes: boolean = true

  constructor(options: XRDSocketOptions) {
    super({
      writableObjectMode: true
    })

    this.xrd = options.xrd
    this.token = options.credentials.token
  }

  connect(callback?: Function) {
    this.connecting = true

    this.socket = io.connect(urls.C3, { query: { auth: this.token, botBox: this.xrd.id } })

    this.socket.on('disconnect', () => {
      this.pending = true
      this.connecting = true
      this.emit('disconnect')
    })

    this.socket.on('connect', () => {
      this.connecting = false
      this.pending = false
      this.remoteAddress = urls.C3
      
      this.emit('connect')
      this.emit('ready')

      if(this.socket) {
        this.socket.emit('subscribeToBotBox2', this.xrd.id)
      }

      if(callback) {
        callback()
      }
    })

    this.socket.on('error', (error: any) => {
      let wrappedError: Error

      if(typeof(error) === 'string') {
        wrappedError = new Error(error)
      } else if (error instanceof Error) {
        wrappedError = error
      } else {
        wrappedError = new Error('Unknown error')
      }

      this.emit('error', wrappedError)

      this.close()
    })

    this.socket.on('onReceiveAutopilotMessage', (data: any) => {
      let messages = this.coder.decode(new Buffer(data, 'base64'))

      if (messages) {
        messages.forEach((message) => {
          if(this.readyForBytes) {
            this.readyForBytes = this.push(message)
          }
        })
      }
    })
  }
  
  _read(size: number) {
    this.readyForBytes = true
  }

  _write(chunk: (string | Buffer | Uint8Array), encoding: string, callback: Function) {
    if(!this.socket || this.pending || this.connecting) {
      return callback(new Error('No connection to XRD'))
    }

    let encodedData = this.coder.encode([{ chunk, encoding }])
    this.__toXRD(encodedData)

    callback()
  }

  _writev(items: Array<{chunk: any, encoding: string}>, callback: Function) {
    if(!this.socket || this.pending || this.connecting) {
      return callback(new Error('No connection to XRD'))
    }
    
    let encodedData = this.coder.encode(items)
    this.__toXRD(encodedData)

    callback()
  }

  _destroy(error: Error | null, callback: (error: Error | null) => void) {
    this.unsubscribe()
    callback(error)
  }

  _final(callback: (error?: Error | null | undefined) => void) {
    this.unsubscribe()
    callback()
  }

  __toXRD(bytes64: string) {
    this.bytesWritten += bytes64.length

    if(this.socket) {
      this.socket.emit('sendAutopilotMessageToBotBox', this.xrd.id, bytes64)
    }
  }

  private unsubscribe() {
    if (this.socket) {
      this.socket.emit('unsubscribeFromBotBox2', this.xrd.id)

      this.socket.disconnect()
      this.socket = undefined
      this.connecting = false
      this.pending = true
      this.remoteAddress = undefined
    }
  }

  close () {
    this.unsubscribe()
    this.emit('close')
  }
}