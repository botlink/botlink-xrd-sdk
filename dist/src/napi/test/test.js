"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const binding_1 = require("../lib/binding");
const binding_2 = require("../lib/binding");
const binding_3 = require("../lib/binding");
const binding_4 = require("../lib/binding");
let sendPeriodic = (conn) => {
    console.log('sending autopilot message');
    let msg = new Buffer([0, 1, 2, 3, 4]);
    try {
        conn.sendAutopilotMessage(msg);
    }
    catch (err) {
        console.log(`Got error '${err}' sending autopilot message`);
    }
};
let pingPeriodic = (conn) => {
    console.log('pinging xrd');
    try {
        conn.pingXrd();
    }
    catch (err) {
        console.log(`Got error '${err}' pinging XRD`);
    }
};
let closeConnection = (conn, sendInterval, pingInterval) => {
    // Stop sending
    clearInterval(sendInterval);
    clearInterval(pingInterval);
    console.log('closing connection');
    conn.closeConnection();
    console.log('closed connection');
    process.exit(0);
};
function login(api, username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // log in with username
            const usernamePassword = { username, password };
            yield api.login(usernamePassword);
            // get token
            const refreshToken = yield api.getRefreshToken();
            // log in with token
            const tokenLogin = { token: refreshToken };
            yield api.login(tokenLogin);
        }
        catch (err) {
            console.log(`log in failed due to ${err}`);
            return;
        }
        console.log('logged in');
    });
}
function connect(api) {
    return __awaiter(this, void 0, void 0, function* () {
        let conn = null;
        try {
            let xrds = yield api.listXrds();
            console.log(`connecting to XRD ${JSON.stringify(xrds[0])}`);
            conn = new binding_1.XrdConnection(api, xrds[0]);
            conn.addVideoTrack();
            conn.setVideoForwardPort(61003);
            conn.on(binding_2.XrdConnectionEvents.ConnectionStatus, (status) => {
                console.log(`Got connectionStatus: ${status}`);
            });
            let connected = yield conn.openConnection(30);
            if (connected) {
                //conn.startEmitter()
                console.log(`connected to XRD ${JSON.stringify(xrds[0])}`);
                conn.on(binding_2.XrdConnectionEvents.AutopilotMessage, (msg) => {
                    console.log(`Callback got msg, length ${msg.length}`);
                });
                conn.on(binding_2.XrdConnectionEvents.VideoConfig, (config) => {
                    console.log(`Got video config reply ${JSON.stringify(config)}`);
                });
                conn.on(binding_2.XrdConnectionEvents.PingResponse, (response) => {
                    console.log(`Got ping reply ${JSON.stringify(response)}`);
                });
                conn.on(binding_2.XrdConnectionEvents.CellSignalInfo, (info) => {
                    console.log(`Got cell signal info ${JSON.stringify(info)}`);
                });
                const videoConfig = {
                    resolution: binding_3.XrdVideoResolution.Resolution_480,
                    framerate: 30, codec: binding_2.XrdVideoCodec.H265,
                    state: binding_2.XrdVideoState.Playing
                };
                conn.setVideoConfig(videoConfig);
                let sendInterval = setInterval(sendPeriodic, 5000, conn);
                let pingInterval = setInterval(pingPeriodic, 1000, conn);
                // Close the conection after 20 seconds
                setTimeout(closeConnection, 20000, conn, sendInterval, pingInterval);
            }
        }
        catch (err) {
            console.log(`failed to connect to xrd due to ${err}`);
            if (conn) {
                conn.closeConnection();
            }
            process.exit(1);
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let api = new binding_1.BotlinkApi();
        api.on(binding_4.BotlinkApiEvents.NewTokens, ({ auth, refresh }) => {
            console.log(`Got auth token: ${auth}`);
            console.log(`Got refresh token: ${refresh}`);
        });
        if (process.argv.length === 3) {
            // script called directly, e.g., "/path/to/test.js"
            yield login(api, process.argv[1], process.argv[2]);
            connect(api);
        }
        else if (process.argv.length === 4) {
            // scripted called with node, e.g., "/usr/bin/node /path/to/test.js"
            yield login(api, process.argv[2], process.argv[3]);
            connect(api);
        }
        else {
            console.log('Need to be called with username and password');
            process.exit(1);
        }
    });
}
main();
