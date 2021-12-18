var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import template from "url-template";
import "isomorphic-fetch";
import * as urls from "./urls";
import { AuthManager } from './auth';
let xrdsPathTemplate = template.parse('/users/{id}/botboxes');
let xrdPathTemplate = template.parse('/botboxes/{id}');
let xrdRegisterPathTemplate = template.parse(`/registerbotbox/{userId}`);
let xrdConfigPathTemplate = template.parse(`/xrd/{xrdId}/config`);
let xrdsPresenceTemplate = template.parse("/xrds/{id}/presence");
export class Api {
    constructor(credentials, skipRefresh) {
        this.credentials = credentials;
        this.authManager = new AuthManager();
        if (!skipRefresh) {
            this.authManager.scheduleRefresh(this.credentials.token, this.credentials.refresh, (newCredentials) => {
                this.credentials = newCredentials;
            });
        }
    }
}
export class XRDApi extends Api {
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
