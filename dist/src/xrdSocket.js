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
        _this.token = options.credentials.token;
        return _this;
    }
    XRDSocket.prototype.connect = function (callback) {
        var _this = this;
        this.connecting = true;
        this.socket = socket_io_client_1.default.connect(urls.C3, { query: { auth: this.token, botBox: this.xrd.id } });
        this.socket.on('disconnect', function () {
            _this.connecting = true;
            _this.emit('disconnect');
        });
        this.socket.once('connect', function () {
            if (callback) {
                callback();
            }
        });
        this.socket.on('connect', function () {
            _this.connecting = false;
            _this.remoteAddress = urls.C3;
            _this.emit('connect');
            _this.emit('ready');
            if (_this.socket) {
                _this.socket.emit('subscribeToBotBox2', _this.xrd.id);
            }
        });
        this.socket.on('error', function (error) {
            var wrappedError;
            if (typeof (error) === 'string') {
                wrappedError = new Error(error);
            }
            else if (error instanceof Error) {
                wrappedError = error;
            }
            else {
                wrappedError = new Error('Unknown error');
            }
            _this.emit('error', wrappedError);
            _this.close();
        });
        this.socket.on('onReceiveAutopilotMessage', function (data) {
            var messages = _this.coder.decode(new Buffer(data, 'base64'));
            if (messages) {
                messages.forEach(function (message) {
                    if (_this.readyForBytes) {
                        _this.readyForBytes = _this.push(message);
                    }
                });
            }
        });
    };
    XRDSocket.prototype._read = function (size) {
        this.readyForBytes = true;
    };
    XRDSocket.prototype._write = function (chunk, encoding, callback) {
        var _this = this;
        if (!this.socket) {
            return callback(new Error('No connection to XRD'));
        }
        if (this.connecting) {
            this.socket.once('connect', function () {
                _this._write(chunk, encoding, callback);
            });
            return;
        }
        var encodedData = this.coder.encode([{ chunk: chunk, encoding: encoding }]);
        this.__toXRD(encodedData);
        callback();
    };
    XRDSocket.prototype._writev = function (items, callback) {
        var _this = this;
        if (!this.socket) {
            return callback(new Error('No connection to XRD'));
        }
        if (this.connecting) {
            this.socket.once('connect', function () {
                _this._writev(items, callback);
            });
            return;
        }
        var encodedData = this.coder.encode(items);
        this.__toXRD(encodedData);
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
    XRDSocket.prototype.__toXRD = function (bytes64) {
        this.bytesWritten += bytes64.length;
        if (this.socket) {
            this.socket.emit('sendAutopilotMessageToBotBox', this.xrd.id, bytes64);
        }
    };
    XRDSocket.prototype.unsubscribe = function () {
        if (this.socket) {
            this.socket.emit('unsubscribeFromBotBox2', this.xrd.id);
            this.socket.disconnect();
            this.socket = undefined;
            this.connecting = false;
            this.remoteAddress = undefined;
        }
    };
    XRDSocket.prototype.close = function () {
        this.unsubscribe();
        this.emit('close');
    };
    return XRDSocket;
}(stream_1.Duplex));
exports.XRDSocket = XRDSocket;
