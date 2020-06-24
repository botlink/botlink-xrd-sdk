"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
require("isomorphic-fetch");
var urls = __importStar(require("./urls"));
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var loginPath = "/sessions/auth";
var refreshPath = "/sessions/refresh";
exports.auth = function (email, password) { return __awaiter(_this, void 0, void 0, function () {
    var response, credentials, auth, refresh, decoded;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetch(urls.API + loginPath, {
                    method: "POST",
                    body: JSON.stringify({
                        email: email,
                        password: password
                    }),
                    headers: [
                        ["Content-Type", "application/json"],
                        ["Accept", "application/json"]
                    ]
                })];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    if (response.status >= 400 && response.status < 500) {
                        throw new Error("Invalid username or password");
                    }
                    else {
                        throw new Error(response.statusText);
                    }
                }
                return [4 /*yield*/, response.json()];
            case 2:
                credentials = _a.sent();
                auth = credentials.auth, refresh = credentials.refresh;
                decoded = jsonwebtoken_1.default.decode(auth);
                return [2 /*return*/, { token: auth, refresh: refresh, user: { id: +decoded.id } }];
        }
    });
}); };
exports.refresh = function (refreshToken) { return __awaiter(_this, void 0, void 0, function () {
    var response, credentials, auth, refresh, decoded;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetch(urls.API + refreshPath, {
                    method: "POST",
                    headers: [
                        ["Authorization", refreshToken],
                        ["Accept", "application/json"]
                    ]
                })];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    throw new Error(response.statusText);
                }
                return [4 /*yield*/, response.json()];
            case 2:
                credentials = _a.sent();
                auth = credentials.auth, refresh = credentials.refresh;
                decoded = jsonwebtoken_1.default.decode(auth);
                return [2 /*return*/, { token: auth, refresh: refresh, user: { id: +decoded.id } }];
        }
    });
}); };
exports.checkRefresh = function (accessToken, refreshToken) { return __awaiter(_this, void 0, void 0, function () {
    var decoded, dateDifference, halfDate, tokenPastHalfLife, newCredentials;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                decoded = jsonwebtoken_1.default.decode(accessToken);
                if (!decoded.exp) {
                    throw new Error('Token does not have a expiration(exp) defined.');
                }
                if (!decoded.iat) {
                    throw new Error('Token does not have a issued at(iat) defined.');
                }
                dateDifference = decoded.exp - decoded.iat;
                halfDate = new Date(decoded.iat + (dateDifference / 2));
                tokenPastHalfLife = new Date() >= halfDate;
                if (!tokenPastHalfLife) {
                    return [2 /*return*/];
                }
                return [4 /*yield*/, exports.refresh(refreshToken)];
            case 1:
                newCredentials = _a.sent();
                return [2 /*return*/, newCredentials];
        }
    });
}); };
var AuthManager = /** @class */ (function () {
    function AuthManager() {
    }
    AuthManager.prototype.scheduleRefresh = function (accessToken, refreshToken, credentialsCallback) {
        return __awaiter(this, void 0, void 0, function () {
            var decoded, dateDifference, oneThridDate, runJobInXMilliseconds;
            var _this = this;
            return __generator(this, function (_a) {
                if (this.scheduledRefresh)
                    return [2 /*return*/];
                decoded = jsonwebtoken_1.default.decode(accessToken);
                if (!decoded.exp) {
                    throw new Error('Token does not have a expiration(exp) defined.');
                }
                if (!decoded.iat) {
                    throw new Error('Token does not have a issued at(iat) defined.');
                }
                dateDifference = decoded.exp - decoded.iat;
                oneThridDate = new Date((decoded.iat + (dateDifference / 3)) * 1000);
                runJobInXMilliseconds = oneThridDate.getTime() - (new Date().getTime());
                this.scheduledRefresh = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                    var newCredentials;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.checkRefresh(accessToken, refreshToken)];
                            case 1:
                                newCredentials = _a.sent();
                                if (newCredentials) {
                                    this.scheduleRefresh(newCredentials.token, newCredentials.refresh, credentialsCallback);
                                    credentialsCallback(newCredentials);
                                }
                                else {
                                    this.scheduleRefresh(accessToken, refreshToken, credentialsCallback);
                                }
                                return [2 /*return*/];
                        }
                    });
                }); }, runJobInXMilliseconds);
                return [2 /*return*/];
            });
        });
    };
    AuthManager.prototype.checkRefresh = function (accessToken, refreshToken) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, exports.checkRefresh(accessToken, refreshToken)];
            });
        });
    };
    return AuthManager;
}());
exports.AuthManager = AuthManager;