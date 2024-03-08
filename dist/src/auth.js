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
exports.AuthManager = exports.refresh = exports.auth = void 0;
require("isomorphic-fetch");
const urls = __importStar(require("./urls"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const loginPath = "/sessions/auth";
const refreshPath = "/sessions/refresh";
const auth = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(urls.API + loginPath, {
        method: "POST",
        body: JSON.stringify({
            email,
            password
        }),
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    });
    if (!response.ok) {
        if (response.status >= 400 && response.status < 500) {
            throw new Error("Invalid username or password");
        }
        else {
            throw new Error(response.statusText);
        }
    }
    const credentials = yield response.json();
    const { auth, refresh } = credentials;
    const decoded = jsonwebtoken_1.default.decode(auth);
    return { token: auth, refresh, user: { id: +decoded.id } };
});
exports.auth = auth;
const refresh = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(urls.API + refreshPath, {
        method: "POST",
        headers: {
            "Authorization": refreshToken,
            "Accept": "application/json"
        }
    });
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    const credentials = yield response.json();
    const { auth, refresh } = credentials;
    const decoded = jsonwebtoken_1.default.decode(auth);
    return { token: auth, refresh, user: { id: +decoded.id } };
});
exports.refresh = refresh;
class AuthManager {
    constructor() { }
    scheduleRefresh(accessToken, refreshToken, credentialsCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.scheduledRefresh)
                return;
            const decoded = jsonwebtoken_1.default.decode(accessToken);
            if (!decoded.exp) {
                throw new Error('Token does not have a expiration(exp) defined.');
            }
            if (!decoded.iat) {
                throw new Error('Token does not have a issued at(iat) defined.');
            }
            const dateDifference = decoded.exp - decoded.iat;
            const halfLife = new Date((decoded.iat + (dateDifference / 2)) * 1000);
            const runJobInXMilliseconds = halfLife.getTime() - (new Date().getTime());
            this.scheduledRefresh = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                this.scheduledRefresh = undefined;
                try {
                    const newCredentials = yield (0, exports.refresh)(refreshToken);
                    this.scheduleRefresh(newCredentials.token, newCredentials.refresh, credentialsCallback);
                    credentialsCallback(newCredentials);
                }
                catch (error) {
                    this.scheduledRefresh = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        this.scheduledRefresh = undefined;
                        this.scheduleRefresh(accessToken, refreshToken, credentialsCallback);
                    }), 5000);
                }
            }), runJobInXMilliseconds);
        });
    }
}
exports.AuthManager = AuthManager;
