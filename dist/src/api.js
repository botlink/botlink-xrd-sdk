"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.XRDApi = exports.Api = void 0;
const url_template_1 = __importDefault(require("url-template"));
require("isomorphic-fetch");
const urls = __importStar(require("./urls"));
const auth_1 = require("./auth");
let xrdsPathTemplate = url_template_1.default.parse('/users/{id}/botboxes');
let xrdPathTemplate = url_template_1.default.parse('/botboxes/{id}');
let xrdRegisterPathTemplate = url_template_1.default.parse(`/registerbotbox/{userId}`);
let xrdConfigPathTemplate = url_template_1.default.parse(`/xrd/{xrdId}/config`);
let xrdsPresenceTemplate = url_template_1.default.parse("/xrds/{id}/presence");
class Api {
    constructor(credentials, skipRefresh) {
        this.credentials = credentials;
        this.authManager = new auth_1.AuthManager();
        if (!skipRefresh) {
            this.authManager.scheduleRefresh(this.credentials.token, this.credentials.refresh, (newCredentials) => {
                this.credentials = newCredentials;
            });
        }
    }
}
exports.Api = Api;
class XRDApi extends Api {
    list() {
        return __awaiter(this, void 0, void 0, function* () {
            const requestUrl = urls.API + xrdsPathTemplate.expand({ id: this.credentials.user.id });
            const response = yield fetch(requestUrl, {
                headers: { "Authorization": this.credentials.token }
            });
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            const body = yield response.json();
            return body.map((xrd) => {
                return {
                    id: xrd.id,
                    hardwareId: xrd.hardwareId,
                    name: xrd.name || xrd.emei
                };
            });
        });
    }
    updateXRD(xrdId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestUrl = urls.API + xrdPathTemplate.expand({ id: xrdId });
            const response = yield fetch(requestUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.credentials.token
                },
                body: JSON.stringify(updateData)
            });
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            const updateResponse = yield response.json();
            return updateResponse;
        });
    }
    registerXRD(hardwareId) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestUrl = urls.API + xrdRegisterPathTemplate.expand({ id: this.credentials.user.id });
            const response = yield fetch(requestUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.credentials.token
                },
                body: JSON.stringify({
                    hardwareId: (hardwareId || '').replace(/-/g, '') // remove dashes, matches rails backend expectations
                })
            });
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            const responseData = yield response.json();
            return responseData;
        });
    }
    getXRDConfig(hardwareId) {
        return __awaiter(this, void 0, void 0, function* () {
            const xrdId = (hardwareId || '').replace(/-/g, '');
            const requestUrl = urls.API + xrdConfigPathTemplate.expand({ xrdId });
            const response = yield fetch(requestUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.credentials.token
                }
            });
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            const xrdConfig = yield response.json();
            return xrdConfig;
        });
    }
    presence() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(urls.INFO + xrdsPresenceTemplate.expand({ id: this.credentials.user.id }), {
                headers: { "Authorization": this.credentials.token }
            });
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            const body = yield response.json();
            return body;
        });
    }
    health() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(urls.C3 + "/health");
                return response.ok;
            }
            catch (error) {
                return false;
            }
        });
    }
}
exports.XRDApi = XRDApi;
