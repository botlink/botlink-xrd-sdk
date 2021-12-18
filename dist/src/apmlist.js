"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.messages = void 0;
/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
const $protobuf = __importStar(require("protobufjs/minimal"));
// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;
// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});
exports.default = $root;
exports.messages = $root.messages = (() => {
    /**
     * Namespace messages.
     * @exports messages
     * @namespace
     */
    const messages = {
        AutopilotMessage: null,
        AutopilotMessageList: null,
        DateTimeOffsetSurrogate: null
    };
    messages.AutopilotMessage = (function () {
        /**
         * Properties of an AutopilotMessage.
         * @memberof messages
         * @interface IAutopilotMessage
         * @property {Uint8Array} Payload AutopilotMessage Payload
         */
        /**
         * Constructs a new AutopilotMessage.
         * @memberof messages
         * @classdesc Represents an AutopilotMessage.
         * @implements IAutopilotMessage
         * @constructor
         * @param {messages.IAutopilotMessage=} [properties] Properties to set
         */
        function AutopilotMessage(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        /**
         * AutopilotMessage Payload.
         * @member {Uint8Array} Payload
         * @memberof messages.AutopilotMessage
         * @instance
         */
        AutopilotMessage.prototype.Payload = $util.newBuffer([]);
        /**
         * Creates a new AutopilotMessage instance using the specified properties.
         * @function create
         * @memberof messages.AutopilotMessage
         * @static
         * @param {messages.IAutopilotMessage=} [properties] Properties to set
         * @returns {messages.AutopilotMessage} AutopilotMessage instance
         */
        AutopilotMessage.create = function create(properties) {
            return new AutopilotMessage(properties);
        };
        /**
         * Encodes the specified AutopilotMessage message. Does not implicitly {@link messages.AutopilotMessage.verify|verify} messages.
         * @function encode
         * @memberof messages.AutopilotMessage
         * @static
         * @param {messages.IAutopilotMessage} message AutopilotMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AutopilotMessage.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            writer.uint32(/* id 1, wireType 2 =*/ 10).bytes(message.Payload);
            return writer;
        };
        /**
         * Encodes the specified AutopilotMessage message, length delimited. Does not implicitly {@link messages.AutopilotMessage.verify|verify} messages.
         * @function encodeDelimited
         * @memberof messages.AutopilotMessage
         * @static
         * @param {messages.IAutopilotMessage} message AutopilotMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AutopilotMessage.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };
        /**
         * Decodes an AutopilotMessage message from the specified reader or buffer.
         * @function decode
         * @memberof messages.AutopilotMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {messages.AutopilotMessage} AutopilotMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AutopilotMessage.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.messages.AutopilotMessage();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.Payload = reader.bytes();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            if (!message.hasOwnProperty("Payload"))
                throw $util.ProtocolError("missing required 'Payload'", { instance: message });
            return message;
        };
        /**
         * Decodes an AutopilotMessage message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof messages.AutopilotMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {messages.AutopilotMessage} AutopilotMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AutopilotMessage.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };
        /**
         * Verifies an AutopilotMessage message.
         * @function verify
         * @memberof messages.AutopilotMessage
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AutopilotMessage.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (!(message.Payload && typeof message.Payload.length === "number" || $util.isString(message.Payload)))
                return "Payload: buffer expected";
            return null;
        };
        /**
         * Creates an AutopilotMessage message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof messages.AutopilotMessage
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {messages.AutopilotMessage} AutopilotMessage
         */
        AutopilotMessage.fromObject = function fromObject(object) {
            if (object instanceof $root.messages.AutopilotMessage)
                return object;
            let message = new $root.messages.AutopilotMessage();
            if (object.Payload != null)
                if (typeof object.Payload === "string")
                    $util.base64.decode(object.Payload, message.Payload = $util.newBuffer($util.base64.length(object.Payload)), 0);
                else if (object.Payload.length)
                    message.Payload = object.Payload;
            return message;
        };
        /**
         * Creates a plain object from an AutopilotMessage message. Also converts values to other types if specified.
         * @function toObject
         * @memberof messages.AutopilotMessage
         * @static
         * @param {messages.AutopilotMessage} message AutopilotMessage
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AutopilotMessage.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                if (options.bytes === String)
                    object.Payload = "";
                else {
                    object.Payload = [];
                    if (options.bytes !== Array)
                        object.Payload = $util.newBuffer(object.Payload);
                }
            if (message.Payload != null && message.hasOwnProperty("Payload"))
                object.Payload = options.bytes === String ? $util.base64.encode(message.Payload, 0, message.Payload.length) : options.bytes === Array ? Array.prototype.slice.call(message.Payload) : message.Payload;
            return object;
        };
        /**
         * Converts this AutopilotMessage to JSON.
         * @function toJSON
         * @memberof messages.AutopilotMessage
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AutopilotMessage.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        return AutopilotMessage;
    })();
    messages.AutopilotMessageList = (function () {
        /**
         * Properties of an AutopilotMessageList.
         * @memberof messages
         * @interface IAutopilotMessageList
         * @property {messages.IDateTimeOffsetSurrogate} GeneratedTime AutopilotMessageList GeneratedTime
         * @property {Array.<messages.IAutopilotMessage>|null} [Messages] AutopilotMessageList Messages
         */
        /**
         * Constructs a new AutopilotMessageList.
         * @memberof messages
         * @classdesc Represents an AutopilotMessageList.
         * @implements IAutopilotMessageList
         * @constructor
         * @param {messages.IAutopilotMessageList=} [properties] Properties to set
         */
        function AutopilotMessageList(properties) {
            this.Messages = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        /**
         * AutopilotMessageList GeneratedTime.
         * @member {messages.IDateTimeOffsetSurrogate} GeneratedTime
         * @memberof messages.AutopilotMessageList
         * @instance
         */
        AutopilotMessageList.prototype.GeneratedTime = null;
        /**
         * AutopilotMessageList Messages.
         * @member {Array.<messages.IAutopilotMessage>} Messages
         * @memberof messages.AutopilotMessageList
         * @instance
         */
        AutopilotMessageList.prototype.Messages = $util.emptyArray;
        /**
         * Creates a new AutopilotMessageList instance using the specified properties.
         * @function create
         * @memberof messages.AutopilotMessageList
         * @static
         * @param {messages.IAutopilotMessageList=} [properties] Properties to set
         * @returns {messages.AutopilotMessageList} AutopilotMessageList instance
         */
        AutopilotMessageList.create = function create(properties) {
            return new AutopilotMessageList(properties);
        };
        /**
         * Encodes the specified AutopilotMessageList message. Does not implicitly {@link messages.AutopilotMessageList.verify|verify} messages.
         * @function encode
         * @memberof messages.AutopilotMessageList
         * @static
         * @param {messages.IAutopilotMessageList} message AutopilotMessageList message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AutopilotMessageList.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            $root.messages.DateTimeOffsetSurrogate.encode(message.GeneratedTime, writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
            if (message.Messages != null && message.Messages.length)
                for (let i = 0; i < message.Messages.length; ++i)
                    $root.messages.AutopilotMessage.encode(message.Messages[i], writer.uint32(/* id 2, wireType 2 =*/ 18).fork()).ldelim();
            return writer;
        };
        /**
         * Encodes the specified AutopilotMessageList message, length delimited. Does not implicitly {@link messages.AutopilotMessageList.verify|verify} messages.
         * @function encodeDelimited
         * @memberof messages.AutopilotMessageList
         * @static
         * @param {messages.IAutopilotMessageList} message AutopilotMessageList message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AutopilotMessageList.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };
        /**
         * Decodes an AutopilotMessageList message from the specified reader or buffer.
         * @function decode
         * @memberof messages.AutopilotMessageList
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {messages.AutopilotMessageList} AutopilotMessageList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AutopilotMessageList.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.messages.AutopilotMessageList();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.GeneratedTime = $root.messages.DateTimeOffsetSurrogate.decode(reader, reader.uint32());
                        break;
                    case 2:
                        if (!(message.Messages && message.Messages.length))
                            message.Messages = [];
                        message.Messages.push($root.messages.AutopilotMessage.decode(reader, reader.uint32()));
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            if (!message.hasOwnProperty("GeneratedTime"))
                throw $util.ProtocolError("missing required 'GeneratedTime'", { instance: message });
            return message;
        };
        /**
         * Decodes an AutopilotMessageList message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof messages.AutopilotMessageList
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {messages.AutopilotMessageList} AutopilotMessageList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AutopilotMessageList.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };
        /**
         * Verifies an AutopilotMessageList message.
         * @function verify
         * @memberof messages.AutopilotMessageList
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AutopilotMessageList.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            {
                let error = $root.messages.DateTimeOffsetSurrogate.verify(message.GeneratedTime);
                if (error)
                    return "GeneratedTime." + error;
            }
            if (message.Messages != null && message.hasOwnProperty("Messages")) {
                if (!Array.isArray(message.Messages))
                    return "Messages: array expected";
                for (let i = 0; i < message.Messages.length; ++i) {
                    let error = $root.messages.AutopilotMessage.verify(message.Messages[i]);
                    if (error)
                        return "Messages." + error;
                }
            }
            return null;
        };
        /**
         * Creates an AutopilotMessageList message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof messages.AutopilotMessageList
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {messages.AutopilotMessageList} AutopilotMessageList
         */
        AutopilotMessageList.fromObject = function fromObject(object) {
            if (object instanceof $root.messages.AutopilotMessageList)
                return object;
            let message = new $root.messages.AutopilotMessageList();
            if (object.GeneratedTime != null) {
                if (typeof object.GeneratedTime !== "object")
                    throw TypeError(".messages.AutopilotMessageList.GeneratedTime: object expected");
                message.GeneratedTime = $root.messages.DateTimeOffsetSurrogate.fromObject(object.GeneratedTime);
            }
            if (object.Messages) {
                if (!Array.isArray(object.Messages))
                    throw TypeError(".messages.AutopilotMessageList.Messages: array expected");
                message.Messages = [];
                for (let i = 0; i < object.Messages.length; ++i) {
                    if (typeof object.Messages[i] !== "object")
                        throw TypeError(".messages.AutopilotMessageList.Messages: object expected");
                    message.Messages[i] = $root.messages.AutopilotMessage.fromObject(object.Messages[i]);
                }
            }
            return message;
        };
        /**
         * Creates a plain object from an AutopilotMessageList message. Also converts values to other types if specified.
         * @function toObject
         * @memberof messages.AutopilotMessageList
         * @static
         * @param {messages.AutopilotMessageList} message AutopilotMessageList
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AutopilotMessageList.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.Messages = [];
            if (options.defaults)
                object.GeneratedTime = null;
            if (message.GeneratedTime != null && message.hasOwnProperty("GeneratedTime"))
                object.GeneratedTime = $root.messages.DateTimeOffsetSurrogate.toObject(message.GeneratedTime, options);
            if (message.Messages && message.Messages.length) {
                object.Messages = [];
                for (let j = 0; j < message.Messages.length; ++j)
                    object.Messages[j] = $root.messages.AutopilotMessage.toObject(message.Messages[j], options);
            }
            return object;
        };
        /**
         * Converts this AutopilotMessageList to JSON.
         * @function toJSON
         * @memberof messages.AutopilotMessageList
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AutopilotMessageList.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        return AutopilotMessageList;
    })();
    messages.DateTimeOffsetSurrogate = (function () {
        /**
         * Properties of a DateTimeOffsetSurrogate.
         * @memberof messages
         * @interface IDateTimeOffsetSurrogate
         * @property {string|null} [DateTimeString] DateTimeOffsetSurrogate DateTimeString
         */
        /**
         * Constructs a new DateTimeOffsetSurrogate.
         * @memberof messages
         * @classdesc Represents a DateTimeOffsetSurrogate.
         * @implements IDateTimeOffsetSurrogate
         * @constructor
         * @param {messages.IDateTimeOffsetSurrogate=} [properties] Properties to set
         */
        function DateTimeOffsetSurrogate(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        /**
         * DateTimeOffsetSurrogate DateTimeString.
         * @member {string} DateTimeString
         * @memberof messages.DateTimeOffsetSurrogate
         * @instance
         */
        DateTimeOffsetSurrogate.prototype.DateTimeString = "";
        /**
         * Creates a new DateTimeOffsetSurrogate instance using the specified properties.
         * @function create
         * @memberof messages.DateTimeOffsetSurrogate
         * @static
         * @param {messages.IDateTimeOffsetSurrogate=} [properties] Properties to set
         * @returns {messages.DateTimeOffsetSurrogate} DateTimeOffsetSurrogate instance
         */
        DateTimeOffsetSurrogate.create = function create(properties) {
            return new DateTimeOffsetSurrogate(properties);
        };
        /**
         * Encodes the specified DateTimeOffsetSurrogate message. Does not implicitly {@link messages.DateTimeOffsetSurrogate.verify|verify} messages.
         * @function encode
         * @memberof messages.DateTimeOffsetSurrogate
         * @static
         * @param {messages.IDateTimeOffsetSurrogate} message DateTimeOffsetSurrogate message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DateTimeOffsetSurrogate.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.DateTimeString != null && message.hasOwnProperty("DateTimeString"))
                writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.DateTimeString);
            return writer;
        };
        /**
         * Encodes the specified DateTimeOffsetSurrogate message, length delimited. Does not implicitly {@link messages.DateTimeOffsetSurrogate.verify|verify} messages.
         * @function encodeDelimited
         * @memberof messages.DateTimeOffsetSurrogate
         * @static
         * @param {messages.IDateTimeOffsetSurrogate} message DateTimeOffsetSurrogate message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DateTimeOffsetSurrogate.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };
        /**
         * Decodes a DateTimeOffsetSurrogate message from the specified reader or buffer.
         * @function decode
         * @memberof messages.DateTimeOffsetSurrogate
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {messages.DateTimeOffsetSurrogate} DateTimeOffsetSurrogate
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DateTimeOffsetSurrogate.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.messages.DateTimeOffsetSurrogate();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.DateTimeString = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };
        /**
         * Decodes a DateTimeOffsetSurrogate message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof messages.DateTimeOffsetSurrogate
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {messages.DateTimeOffsetSurrogate} DateTimeOffsetSurrogate
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DateTimeOffsetSurrogate.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };
        /**
         * Verifies a DateTimeOffsetSurrogate message.
         * @function verify
         * @memberof messages.DateTimeOffsetSurrogate
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        DateTimeOffsetSurrogate.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.DateTimeString != null && message.hasOwnProperty("DateTimeString"))
                if (!$util.isString(message.DateTimeString))
                    return "DateTimeString: string expected";
            return null;
        };
        /**
         * Creates a DateTimeOffsetSurrogate message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof messages.DateTimeOffsetSurrogate
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {messages.DateTimeOffsetSurrogate} DateTimeOffsetSurrogate
         */
        DateTimeOffsetSurrogate.fromObject = function fromObject(object) {
            if (object instanceof $root.messages.DateTimeOffsetSurrogate)
                return object;
            let message = new $root.messages.DateTimeOffsetSurrogate();
            if (object.DateTimeString != null)
                message.DateTimeString = String(object.DateTimeString);
            return message;
        };
        /**
         * Creates a plain object from a DateTimeOffsetSurrogate message. Also converts values to other types if specified.
         * @function toObject
         * @memberof messages.DateTimeOffsetSurrogate
         * @static
         * @param {messages.DateTimeOffsetSurrogate} message DateTimeOffsetSurrogate
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        DateTimeOffsetSurrogate.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.DateTimeString = "";
            if (message.DateTimeString != null && message.hasOwnProperty("DateTimeString"))
                object.DateTimeString = message.DateTimeString;
            return object;
        };
        /**
         * Converts this DateTimeOffsetSurrogate to JSON.
         * @function toJSON
         * @memberof messages.DateTimeOffsetSurrogate
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        DateTimeOffsetSurrogate.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        return DateTimeOffsetSurrogate;
    })();
    return messages;
})();
