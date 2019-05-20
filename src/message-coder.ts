import { messages } from './apmlist'

export default class MessageCoder {
  encode(items: Array<{ chunk: any, encoding: string }>): string {
    const list = new messages.AutopilotMessageList({GeneratedTime: new messages.DateTimeOffsetSurrogate() })
    
    items.forEach((item) => {
      const {
        chunk, encoding
      } = item

      if(chunk instanceof Buffer) {
        list.Messages.push(new messages.AutopilotMessage({Payload: chunk}))
      } else if(chunk instanceof Uint8Array) {
        list.Messages.push(new messages.AutopilotMessage({Payload: Buffer.from(chunk)}))
      } else {
        // TODO: Probably not guaranteed a string past this point?
        list.Messages.push(new messages.AutopilotMessage({Payload: Buffer.from(chunk, <BufferEncoding>encoding)}))
      }
    })
    
    return Buffer.from(messages.AutopilotMessageList.encode(list).finish()).toString('base64')
  }

  decode(data: Buffer) {
    console.log(`Decoding ${data.byteLength} bytes`)
    const list = messages.AutopilotMessageList.decode(data)

    let encodedMessages = list.Messages
    let decodedMessages: Array<Buffer> = []

    encodedMessages.forEach((message) => {
      let content = message.Payload
      decodedMessages.push(Buffer.from(content))
    })

    return decodedMessages
  }
}