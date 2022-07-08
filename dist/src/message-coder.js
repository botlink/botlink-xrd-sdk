"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apmlist_1 = require("./apmlist");
class MessageCoder {
    encode(items) {
        const list = new apmlist_1.messages.AutopilotMessageList({ GeneratedTime: new apmlist_1.messages.DateTimeOffsetSurrogate() });
        items.forEach((item) => {
            const { chunk, encoding } = item;
            if (chunk instanceof Buffer) {
                list.Messages.push(new apmlist_1.messages.AutopilotMessage({ Payload: chunk }));
            }
            else if (chunk instanceof Uint8Array) {
                list.Messages.push(new apmlist_1.messages.AutopilotMessage({ Payload: Buffer.from(chunk) }));
            }
            else {
                // TODO: Probably not guaranteed a string past this point?
                list.Messages.push(new apmlist_1.messages.AutopilotMessage({ Payload: Buffer.from(chunk, encoding) }));
            }
        });
        return Buffer.from(apmlist_1.messages.AutopilotMessageList.encode(list).finish()).toString('base64');
    }
    decode(data) {
        const list = apmlist_1.messages.AutopilotMessageList.decode(data);
        let encodedMessages = list.Messages;
        let decodedMessages = [];
        encodedMessages.forEach((message) => {
            let content = message.Payload;
            decodedMessages.push(Buffer.from(content));
        });
        return decodedMessages;
    }
}
exports.default = MessageCoder;
