/// <reference types="node" />
export default class MessageCoder {
    encode(items: Array<{
        chunk: any;
        encoding: string;
    }>): string;
    decode(data: Buffer): Buffer[];
}
