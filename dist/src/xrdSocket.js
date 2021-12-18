var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import io from "socket.io-client";
import MessageCoder from "./message-coder";
import * as urls from "./urls";
import { Duplex } from "stream";
import { AuthManager } from './auth';
export class XRDSocket extends Duplex {
    constructor(options) {
        super({
            writableObjectMode: true
        });
        this.coder = new MessageCoder();
        this.bytesRead = 0;
        this.bytesWritten = 0;
        this.pending = true;
        this.connecting = false;
        this.readyForBytes = true;
        this.xrd = options.xrd;
        this.credentials = options.credentials;
        this.authManager = new AuthManager();
        if (!options.skipRefresh) {
            this.authManager.scheduleRefresh(this.credentials.token, this.credentials.refresh, (newCredentials) => {
                this.credentials = newCredentials;
            });
        }
    }
    connect(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            this.connecting = true;
            this.socket = io.connect(urls.C3 + "/flight", {
                query: { auth: this.credentials.token, botBox: this.xrd.id }
            });
            this.socket.on("disconnect", () => {
                this.connecting = true;
                this.emit("disconnect");
            });
            this.socket.once("connect", () => {
                if (callback) {
                    callback();
                }
            });
            this.socket.on("connect", () => {
                this.connecting = false;
                this.remoteAddress = urls.C3;
                this.emit("connect");
                this.emit("ready");
                if (this.socket) {
                    this.socket.emit("subscribeToBotBox2", this.xrd.id);
                }
            });
            this.socket.on("error", (error) => {
                let wrappedError;
                if (typeof error === "string") {
                    wrappedError = new Error(error);
                }
                else if (error instanceof Error) {
                    wrappedError = error;
                }
                else {
                    wrappedError = new Error("Unknown error");
                }
                this.emit("error", wrappedError);
                this.close();
            });
            this.socket.on("onReceiveAutopilotMessage", (data) => {
                let messages = this.coder.decode(new Buffer(data, "base64"));
                if (messages) {
                    messages.forEach(message => {
                        if (this.readyForBytes) {
                            this.readyForBytes = this.push(message);
                        }
                    });
                }
            });
        });
    }
    _read(size) {
        this.readyForBytes = true;
    }
    _write(chunk, encoding, callback) {
        if (!this.socket) {
            return callback(new Error("No connection to XRD"));
        }
        if (this.connecting) {
            this.socket.once("connect", () => {
                this._write(chunk, encoding, callback);
            });
            return;
        }
        let encodedData = this.coder.encode([{ chunk, encoding }]);
        this.writeToSocketIO(encodedData);
        callback();
    }
    _writev(items, callback) {
        if (!this.socket) {
            return callback(new Error("No connection to XRD"));
        }
        if (this.connecting) {
            this.socket.once("connect", () => {
                this._writev(items, callback);
            });
            return;
        }
        let encodedData = this.coder.encode(items);
        this.writeToSocketIO(encodedData);
        callback();
    }
    _destroy(error, callback) {
        this.unsubscribe();
        callback(error);
    }
    _final(callback) {
        this.unsubscribe();
        callback();
    }
    writeToSocketIO(bytes64) {
        this.bytesWritten += bytes64.length;
        if (this.socket) {
            this.socket.emit("sendAutopilotMessageToBotBox", this.xrd.id, bytes64);
        }
    }
    unsubscribe() {
        if (this.socket) {
            this.socket.emit("unsubscribeFromBotBox2", this.xrd.id);
            this.socket.disconnect();
            this.socket = undefined;
            this.connecting = false;
            this.remoteAddress = undefined;
        }
    }
    close() {
        this.unsubscribe();
        this.emit("close");
    }
}
