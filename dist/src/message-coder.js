"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var apmlist_1 = require("./apmlist");
var MessageCoder = /** @class */ (function () {
    function MessageCoder() {
    }
    MessageCoder.prototype.encode = function (items) {
        var list = new apmlist_1.messages.AutopilotMessageList({ GeneratedTime: new apmlist_1.messages.DateTimeOffsetSurrogate() });
        items.forEach(function (item) {
            var chunk = item.chunk, encoding = item.encoding;
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
    };
    MessageCoder.prototype.decode = function (data) {
        var list = apmlist_1.messages.AutopilotMessageList.decode(data);
        var encodedMessages = list.Messages;
        var decodedMessages = [];
        encodedMessages.forEach(function (message) {
            var content = message.Payload;
            decodedMessages.push(Buffer.from(content));
        });
        return decodedMessages;
    };
    return MessageCoder;
}());
exports.default = MessageCoder;
