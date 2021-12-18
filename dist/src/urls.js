"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INFO = exports.C3 = exports.API = void 0;
exports.API = process.env.BOTLINK_API_URL || "https://api.botlink.com";
exports.C3 = process.env.BOTLINK_FLIGHT_URL || "https://c3.botlink.com";
exports.INFO = process.env.BOTLINK_INFO_URL ||
    "https://botlink-signal-production.herokuapp.com";
