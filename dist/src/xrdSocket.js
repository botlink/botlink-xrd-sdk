"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var socket_io_client_1 = __importDefault(require("socket.io-client"));
var message_coder_1 = __importDefault(require("./message-coder"));
var urls = __importStar(require("./urls"));
var stream_1 = require("stream");
var auth_1 = require("./auth");
var XRDSocket = /** @class */ (function (_super) {
    __extends(XRDSocket, _super);
    function XRDSocket(options) {
        var _this = _super.call(this, {
            writableObjectMode: true
        }) || this;
        _this.coder = new message_coder_1.default();
        _this.bytesRead = 0;
        _this.bytesWritten = 0;
        _this.pending = true;
        _this.connecting = false;
        _this.readyForBytes = true;
        _this.xrd = options.xrd;
        _this.credentials = options.credentials;
        _this.authManager = new auth_1.AuthManager();
        if (_this.credentials.token && _this.credentials.refresh) {
            _this.authManager.scheduleRefresh(_this.credentials.token, _this.credentials.refresh, function (newCredentials) {
                _this.credentials = newCredentials;
            });
        }
        return _this;
    }
    XRDSocket.prototype.connect = function (callback) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.connecting = true;
                this.socket = socket_io_client_1.default.connect(urls.C3 + "/flight", {
                    query: { auth: this.credentials.token, botBox: this.xrd.id }
                });
                this.socket.on("disconnect", function () {
                    _this.connecting = true;
                    _this.emit("disconnect");
                });
                this.socket.once("connect", function () {
                    if (callback) {
                        callback();
                    }
                });
                this.socket.on("connect", function () {
                    _this.connecting = false;
                    _this.remoteAddress = urls.C3;
                    _this.emit("connect");
                    _this.emit("ready");
                    if (_this.socket) {
                        _this.socket.emit("subscribeToBotBox2", _this.xrd.id);
                    }
                });
                this.socket.on("error", function (error) {
                    var wrappedError;
                    if (typeof error === "string") {
                        wrappedError = new Error(error);
                    }
                    else if (error instanceof Error) {
                        wrappedError = error;
                    }
                    else {
                        wrappedError = new Error("Unknown error");
                    }
                    _this.emit("error", wrappedError);
                    _this.close();
                });
                this.socket.on("onReceiveAutopilotMessage", function (data) {
                    var messages = _this.coder.decode(new Buffer(data, "base64"));
                    if (messages) {
                        messages.forEach(function (message) {
                            if (_this.readyForBytes) {
                                _this.readyForBytes = _this.push(message);
                            }
                        });
                    }
                });
                return [2 /*return*/];
            });
        });
    };
    XRDSocket.prototype._read = function (size) {
        this.readyForBytes = true;
    };
    XRDSocket.prototype._write = function (chunk, encoding, callback) {
        var _this = this;
        if (!this.socket) {
            return callback(new Error("No connection to XRD"));
        }
        if (this.connecting) {
            this.socket.once("connect", function () {
                _this._write(chunk, encoding, callback);
            });
            return;
        }
        var encodedData = this.coder.encode([{ chunk: chunk, encoding: encoding }]);
        this.writeToSocketIO(encodedData);
        callback();
    };
    XRDSocket.prototype._writev = function (items, callback) {
        var _this = this;
        if (!this.socket) {
            return callback(new Error("No connection to XRD"));
        }
        if (this.connecting) {
            this.socket.once("connect", function () {
                _this._writev(items, callback);
            });
            return;
        }
        var encodedData = this.coder.encode(items);
        this.writeToSocketIO(encodedData);
        callback();
    };
    XRDSocket.prototype._destroy = function (error, callback) {
        this.unsubscribe();
        callback(error);
    };
    XRDSocket.prototype._final = function (callback) {
        this.unsubscribe();
        callback();
    };
    XRDSocket.prototype.writeToSocketIO = function (bytes64) {
        this.bytesWritten += bytes64.length;
        if (this.socket) {
            this.socket.emit("sendAutopilotMessageToBotBox", this.xrd.id, bytes64);
        }
    };
    XRDSocket.prototype.unsubscribe = function () {
        if (this.socket) {
            this.socket.emit("unsubscribeFromBotBox2", this.xrd.id);
            this.socket.disconnect();
            this.socket = undefined;
            this.connecting = false;
            this.remoteAddress = undefined;
        }
    };
    XRDSocket.prototype.close = function () {
        this.unsubscribe();
        this.emit("close");
    };
    return XRDSocket;
}(stream_1.Duplex));
exports.XRDSocket = XRDSocket;
