import io from 'socket.io-client'
import MessageCoder from './src/message-coder'
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
  private messageBuffers: Array<Buffer>
  private token: string 
  readonly xrd: XRD
  bytesRead: number = 0
  bytesWritten: number = 0

  pending: boolean = true
  connecting: boolean = false

  remoteAddress?: string
  private wantsMoreBytes: boolean = true

  constructor(options: XRDSocketOptions) {
    super({
      writableObjectMode: true
    })

    this.xrd = options.xrd
    this.token = options.credentials.token
    this.messageBuffers = []
  }

  connect(callback?: Function) {
    this.connecting = true

    this.socket = io.connect(urls.C3, { query: { auth: this.token, botBox: this.xrd.id } })

    this.socket.once('connect', () => {
      this.connecting = false
      this.pending = false
      this.remoteAddress = urls.C3
      
      if(this.socket) {
        this.socket.emit('subscribeToBotBox2', this.xrd.id)
      }

      this.emit('connect')
      if(callback) {
        callback()
      }
    })

    this.socket.on('error', (error: any) => {
      this.emit('error', error)
    })

    this.socket.on('onReceiveAutopilotMessage', (data: any) => {
      let messages = this.coder.decode(new Buffer(data, 'base64'))

      if (messages) {
        messages.forEach((message) => {
          if(this.wantsMoreBytes) {
            this.wantsMoreBytes = this.push(message)
          }
        })
      }
    })
  }
  
  _read(size: number) {
    console.log('_read')
    this.wantsMoreBytes = true
    // while(this.messageBuffers.length > 0) {
    //   console.log('Dequeueing message')
    //   let chunk = this.messageBuffers.splice(0)[0]
    //   this.bytesRead += chunk.byteLength
    //   if(!this.push(chunk)) {
    //     break
    //   }
    // }
  }

  _write(chunk: (string | Buffer | Uint8Array), encoding: string, callback: Function) {
    if(!this.socket) {
      return callback(new Error('No connection to XRD'))
    }

    let encodedData = this.coder.encode([{ chunk, encoding }])
    this.__toXRD(encodedData)

    callback()
  }

  _writev(items: Array<{chunk: any, encoding: string}>, callback: Function) {
    if(!this.socket) {
      return callback(new Error('No connection to XRD'))
    }
    
    let encodedData = this.coder.encode(items)
    this.__toXRD(encodedData)

    callback()
  }

  __toXRD(bytes64: string) {
    console.log('__toXRD')
    this.bytesWritten += bytes64.length

    if(this.socket) {
      this.socket.emit('sendAutopilotMessageToBotBox', bytes64)
    }
  }

  close () {
    if (this.socket) {
      this.socket.emit('unsubscribeFromBotBox2', this.xrd.id)

      this.socket.disconnect()
      this.socket = undefined
      this.connecting = false
      this.pending = true
      this.remoteAddress = undefined

      this.emit('close')
    }
  }
}

