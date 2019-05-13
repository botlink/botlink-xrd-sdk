import * as $protobuf from "protobufjs";
/** Namespace messages. */
export namespace messages {

    /** Properties of an AutopilotMessage. */
    interface IAutopilotMessage {

        /** AutopilotMessage Payload */
        Payload: Uint8Array;
    }

    /** Represents an AutopilotMessage. */
    class AutopilotMessage implements IAutopilotMessage {

        /**
         * Constructs a new AutopilotMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: messages.IAutopilotMessage);

        /** AutopilotMessage Payload. */
        public Payload: Uint8Array;

        /**
         * Creates a new AutopilotMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns AutopilotMessage instance
         */
        public static create(properties?: messages.IAutopilotMessage): messages.AutopilotMessage;

        /**
         * Encodes the specified AutopilotMessage message. Does not implicitly {@link messages.AutopilotMessage.verify|verify} messages.
         * @param message AutopilotMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: messages.IAutopilotMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified AutopilotMessage message, length delimited. Does not implicitly {@link messages.AutopilotMessage.verify|verify} messages.
         * @param message AutopilotMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: messages.IAutopilotMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an AutopilotMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns AutopilotMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): messages.AutopilotMessage;

        /**
         * Decodes an AutopilotMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns AutopilotMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): messages.AutopilotMessage;

        /**
         * Verifies an AutopilotMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an AutopilotMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns AutopilotMessage
         */
        public static fromObject(object: { [k: string]: any }): messages.AutopilotMessage;

        /**
         * Creates a plain object from an AutopilotMessage message. Also converts values to other types if specified.
         * @param message AutopilotMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: messages.AutopilotMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this AutopilotMessage to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an AutopilotMessageList. */
    interface IAutopilotMessageList {

        /** AutopilotMessageList GeneratedTime */
        GeneratedTime: messages.IDateTimeOffsetSurrogate;

        /** AutopilotMessageList Messages */
        Messages?: (messages.IAutopilotMessage[]|null);
    }

    /** Represents an AutopilotMessageList. */
    class AutopilotMessageList implements IAutopilotMessageList {

        /**
         * Constructs a new AutopilotMessageList.
         * @param [properties] Properties to set
         */
        constructor(properties?: messages.IAutopilotMessageList);

        /** AutopilotMessageList GeneratedTime. */
        public GeneratedTime: messages.IDateTimeOffsetSurrogate;

        /** AutopilotMessageList Messages. */
        public Messages: messages.IAutopilotMessage[];

        /**
         * Creates a new AutopilotMessageList instance using the specified properties.
         * @param [properties] Properties to set
         * @returns AutopilotMessageList instance
         */
        public static create(properties?: messages.IAutopilotMessageList): messages.AutopilotMessageList;

        /**
         * Encodes the specified AutopilotMessageList message. Does not implicitly {@link messages.AutopilotMessageList.verify|verify} messages.
         * @param message AutopilotMessageList message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: messages.IAutopilotMessageList, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified AutopilotMessageList message, length delimited. Does not implicitly {@link messages.AutopilotMessageList.verify|verify} messages.
         * @param message AutopilotMessageList message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: messages.IAutopilotMessageList, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an AutopilotMessageList message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns AutopilotMessageList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): messages.AutopilotMessageList;

        /**
         * Decodes an AutopilotMessageList message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns AutopilotMessageList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): messages.AutopilotMessageList;

        /**
         * Verifies an AutopilotMessageList message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an AutopilotMessageList message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns AutopilotMessageList
         */
        public static fromObject(object: { [k: string]: any }): messages.AutopilotMessageList;

        /**
         * Creates a plain object from an AutopilotMessageList message. Also converts values to other types if specified.
         * @param message AutopilotMessageList
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: messages.AutopilotMessageList, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this AutopilotMessageList to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a DateTimeOffsetSurrogate. */
    interface IDateTimeOffsetSurrogate {

        /** DateTimeOffsetSurrogate DateTimeString */
        DateTimeString?: (string|null);
    }

    /** Represents a DateTimeOffsetSurrogate. */
    class DateTimeOffsetSurrogate implements IDateTimeOffsetSurrogate {

        /**
         * Constructs a new DateTimeOffsetSurrogate.
         * @param [properties] Properties to set
         */
        constructor(properties?: messages.IDateTimeOffsetSurrogate);

        /** DateTimeOffsetSurrogate DateTimeString. */
        public DateTimeString: string;

        /**
         * Creates a new DateTimeOffsetSurrogate instance using the specified properties.
         * @param [properties] Properties to set
         * @returns DateTimeOffsetSurrogate instance
         */
        public static create(properties?: messages.IDateTimeOffsetSurrogate): messages.DateTimeOffsetSurrogate;

        /**
         * Encodes the specified DateTimeOffsetSurrogate message. Does not implicitly {@link messages.DateTimeOffsetSurrogate.verify|verify} messages.
         * @param message DateTimeOffsetSurrogate message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: messages.IDateTimeOffsetSurrogate, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified DateTimeOffsetSurrogate message, length delimited. Does not implicitly {@link messages.DateTimeOffsetSurrogate.verify|verify} messages.
         * @param message DateTimeOffsetSurrogate message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: messages.IDateTimeOffsetSurrogate, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a DateTimeOffsetSurrogate message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns DateTimeOffsetSurrogate
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): messages.DateTimeOffsetSurrogate;

        /**
         * Decodes a DateTimeOffsetSurrogate message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns DateTimeOffsetSurrogate
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): messages.DateTimeOffsetSurrogate;

        /**
         * Verifies a DateTimeOffsetSurrogate message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a DateTimeOffsetSurrogate message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns DateTimeOffsetSurrogate
         */
        public static fromObject(object: { [k: string]: any }): messages.DateTimeOffsetSurrogate;

        /**
         * Creates a plain object from a DateTimeOffsetSurrogate message. Also converts values to other types if specified.
         * @param message DateTimeOffsetSurrogate
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: messages.DateTimeOffsetSurrogate, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this DateTimeOffsetSurrogate to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }
}
