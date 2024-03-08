"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XRDSocket = void 0;
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const message_coder_1 = __importDefault(require("./message-coder"));
const urls = __importStar(require("./urls"));
const stream_1 = require("stream");
const auth_1 = require("./auth");
class XRDSocket extends stream_1.Duplex {
    constructor(options) {
        super({
            writableObjectMode: true
        });
        this.coder = new message_coder_1.default();
        this.bytesRead = 0;
        this.bytesWritten = 0;
        this.pending = true;
        this.connecting = false;
        this.readyForBytes = true;
        this.xrd = options.xrd;
        this.credentials = options.credentials;
        this.authManager = new auth_1.AuthManager();
        if (!options.skipRefresh) {
            this.authManager.scheduleRefresh(this.credentials.token, this.credentials.refresh, (newCredentials) => {
                this.credentials = newCredentials;
            });
        }
    }
    connect(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            this.connecting = true;
            this.socket = socket_io_client_1.default.connect(urls.C3 + "/flight", {
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
exports.XRDSocket = XRDSocket;
