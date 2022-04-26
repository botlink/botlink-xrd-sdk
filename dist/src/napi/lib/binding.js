"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XrdLogger = exports.XrdConnection = exports.BotlinkApi = exports.XrdLoggerSource = exports.XrdConnectionEvents = exports.XrdVideoState = exports.XrdVideoCodec = exports.XrdVideoResolution = exports.XrdConnectionStatus = exports.BotlinkApiEvents = void 0;
//const CxxClient = require('bindings')('botlink_xrd_sdk_bindings')
var binary = require('@mapbox/node-pre-gyp');
var path = require('path');
// top-level directory starting from dist/src/napi/lib
var binding_path = binary.find(path.resolve(path.join(__dirname, '../../../.././package.json')));
const CxxClient = require(binding_path);
const events_1 = require("events");
const util_1 = require("util");
/**
 * Events emitted by BotlinkApi
 *
 * [[`BotlinkApi`]] emits these
 */
var BotlinkApiEvents;
(function (BotlinkApiEvents) {
    BotlinkApiEvents["NewTokens"] = "NewTokens";
})(BotlinkApiEvents = exports.BotlinkApiEvents || (exports.BotlinkApiEvents = {}));
/**
 * The status of a connection to an XRD.
 *
 * [[`XrdConnection`]] emits this as part of an
 * [[`XrdConnectionEvents.ConnectionStatus`]] event.
 */
var XrdConnectionStatus;
(function (XrdConnectionStatus) {
    XrdConnectionStatus["Connected"] = "Connected";
    XrdConnectionStatus["Connecting"] = "Connecting";
    XrdConnectionStatus["Disconnected"] = "Disconnected";
})(XrdConnectionStatus = exports.XrdConnectionStatus || (exports.XrdConnectionStatus = {}));
/**
 * Video resolutions that can be selected for RTP stream
 */
var XrdVideoResolution;
(function (XrdVideoResolution) {
    XrdVideoResolution["Unsupported"] = "Unsupported";
    /** 256x144 */
    XrdVideoResolution["Resolution_144"] = "144";
    /** 426x240 */
    XrdVideoResolution["Resolution_240"] = "240";
    /** 640x360 */
    XrdVideoResolution["Resolution_360"] = "360";
    /** 854x480 */
    XrdVideoResolution["Resolution_480"] = "480";
    /** 1280x720 */
    XrdVideoResolution["Resolution_720"] = "720";
    /** 1920x1080 */
    XrdVideoResolution["Resolution_1080"] = "1080";
    /** 3840x2160 */
    XrdVideoResolution["Resolution_4k"] = "4k";
})(XrdVideoResolution = exports.XrdVideoResolution || (exports.XrdVideoResolution = {}));
/**
 * Codecs used by the XRD to encode video.
 */
var XrdVideoCodec;
(function (XrdVideoCodec) {
    XrdVideoCodec["Unknown"] = "Unknown";
    XrdVideoCodec["H264"] = "H264";
    XrdVideoCodec["H265"] = "H265";
})(XrdVideoCodec = exports.XrdVideoCodec || (exports.XrdVideoCodec = {}));
/**
 * State of the video stream from the XRD
 */
var XrdVideoState;
(function (XrdVideoState) {
    XrdVideoState["Unknown"] = "Unknown";
    XrdVideoState["Paused"] = "Paused";
    XrdVideoState["Playing"] = "Playing";
})(XrdVideoState = exports.XrdVideoState || (exports.XrdVideoState = {}));
/**
 * Events that [[`XrdConnection`]] emits.
 *
 * See [[`XrdConnectionBindings.on`]] for registering callbacks.
 */
var XrdConnectionEvents;
(function (XrdConnectionEvents) {
    /** Event when the connection received an autopilot message from the XRD. */
    XrdConnectionEvents["AutopilotMessage"] = "autopilotMessage";
    /** Event when the status of the connection to the XRD changes. */
    XrdConnectionEvents["ConnectionStatus"] = "connectionStatus";
    /** Event when the connection received a video configuration message from the XRD. */
    XrdConnectionEvents["VideoConfig"] = "videoConfig";
    /** Event when the connection received a ping response message from the XRD. */
    XrdConnectionEvents["PingResponse"] = "pingResponse";
})(XrdConnectionEvents = exports.XrdConnectionEvents || (exports.XrdConnectionEvents = {}));
/**
 * Enum used to tag the source of an autopilot message when logging an autopilot
 * message.
 *
 * This enum is meant for use with [[`XrdLogger`]]. The values for tagging an
 * autopilot message sent to or received from an XRD are not listed here as that
 * is handled internally by [[`XrdConnection`]].
 */
var XrdLoggerSource;
(function (XrdLoggerSource) {
    /** Autopilot message is from an unknown source. */
    XrdLoggerSource[XrdLoggerSource["Unknown"] = 0] = "Unknown";
    /** Autopilot message received from the Ground Control Software */
    XrdLoggerSource[XrdLoggerSource["FromGcs"] = 7] = "FromGcs";
    /** Autopilot message sent to the Ground Control Software */
    XrdLoggerSource[XrdLoggerSource["ToGcs"] = 8] = "ToGcs";
})(XrdLoggerSource = exports.XrdLoggerSource || (exports.XrdLoggerSource = {}));
(0, util_1.inherits)(CxxClient.BotlinkApi, events_1.EventEmitter);
(0, util_1.inherits)(CxxClient.XrdConnection, events_1.EventEmitter);
/** C++ implementation of [[`ApiBindings`]] */
let BotlinkApi = CxxClient.BotlinkApi;
exports.BotlinkApi = BotlinkApi;
/** C++ implementation of [[`XrdConnectionBindings`]] */
let XrdConnection = CxxClient.XrdConnection;
exports.XrdConnection = XrdConnection;
/** C++ implementation of [[`XrdLoggerBindings`]] */
let XrdLogger = CxxClient.XrdLogger;
exports.XrdLogger = XrdLogger;
