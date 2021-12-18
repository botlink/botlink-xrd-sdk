var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import "isomorphic-fetch";
import * as urls from "./urls";
import jwt from "jsonwebtoken";
const loginPath = "/sessions/auth";
const refreshPath = "/sessions/refresh";
export const auth = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
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
    const decoded = jwt.decode(auth);
    return { token: auth, refresh, user: { id: +decoded.id } };
});
export const refresh = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
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
    const decoded = jwt.decode(auth);
    return { token: auth, refresh, user: { id: +decoded.id } };
});
export class AuthManager {
    constructor() { }
    scheduleRefresh(accessToken, refreshToken, credentialsCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.scheduledRefresh)
                return;
            const decoded = jwt.decode(accessToken);
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
                    const newCredentials = yield refresh(refreshToken);
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
