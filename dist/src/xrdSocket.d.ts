/// <reference types="node" />
import { XRD } from "./xrd";
import { Duplex } from "stream";
import { Credentials } from './auth';
export interface XRDSocketOptions {
    xrd: XRD;
    credentials: Credentials;
    skipRefresh: boolean;
}
export declare class XRDSocket extends Duplex {
    private authManager;
    private socket?;
    private coder;
    private credentials;
    readonly xrd: XRD;
    bytesRead: number;
    bytesWritten: number;
    pending: boolean;
    connecting: boolean;
    remoteAddress?: string;
    private readyForBytes;
    constructor(options: XRDSocketOptions);
    connect(callback?: Function): Promise<void>;
    _read(size: number): void;
    _write(chunk: string | Buffer | Uint8Array, encoding: string, callback: Function): any;
    _writev(items: Array<{
        chunk: any;
        encoding: string;
    }>, callback: Function): any;
    _destroy(error: Error | null, callback: (error: Error | null) => void): void;
    _final(callback: (error?: Error | null | undefined) => void): void;
    private writeToSocketIO;
    private unsubscribe;
    close(): void;
}
