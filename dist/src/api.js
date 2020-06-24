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
var url_template_1 = __importDefault(require("url-template"));
require("isomorphic-fetch");
var urls = __importStar(require("./urls"));
var auth_1 = require("./auth");
var xrdsPathTemplate = url_template_1.default.parse('/users/{id}/botboxes');
var xrdPathTemplate = url_template_1.default.parse('/botboxes/{id}');
var xrdRegisterPathTemplate = url_template_1.default.parse("/registerbotbox/{userId}");
var xrdConfigPathTemplate = url_template_1.default.parse("/xrd/{xrdId}/config");
var xrdsPresenceTemplate = url_template_1.default.parse("/xrds/{id}/presence");
var Api = /** @class */ (function () {
    function Api(credentials, skipRefresh) {
        var _this = this;
        this.credentials = credentials;
        this.authManager = new auth_1.AuthManager();
        if (!skipRefresh) {
            this.authManager.scheduleRefresh(this.credentials.token, this.credentials.refresh, function (newCredentials) {
                _this.credentials = newCredentials;
            });
        }
    }
    return Api;
}());
exports.Api = Api;
var XRDApi = /** @class */ (function (_super) {
    __extends(XRDApi, _super);
    function XRDApi() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    XRDApi.prototype.list = function () {
        return __awaiter(this, void 0, void 0, function () {
            var requestUrl, response, body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestUrl = urls.API + xrdsPathTemplate.expand({ id: this.credentials.user.id });
                        return [4 /*yield*/, fetch(requestUrl, {
                                headers: [["Authorization", this.credentials.token]]
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error(response.statusText);
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        body = _a.sent();
                        return [2 /*return*/, body.map(function (xrd) {
                                return {
                                    id: xrd.id,
                                    hardwareId: xrd.hardwareId,
                                    name: xrd.name || xrd.emei
                                };
                            })];
                }
            });
        });
    };
    XRDApi.prototype.updateXRD = function (xrdId, updateData) {
        return __awaiter(this, void 0, void 0, function () {
            var requestUrl, response, updateResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestUrl = urls.API + xrdPathTemplate.expand({ id: xrdId });
                        return [4 /*yield*/, fetch(requestUrl, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': this.credentials.token
                                },
                                body: JSON.stringify(updateData)
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error(response.statusText);
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        updateResponse = _a.sent();
                        return [2 /*return*/, updateResponse];
                }
            });
        });
    };
    XRDApi.prototype.registerXRD = function (hardwareId) {
        return __awaiter(this, void 0, void 0, function () {
            var requestUrl, response, responseData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        requestUrl = urls.API + xrdRegisterPathTemplate.expand({ id: this.credentials.user.id });
                        return [4 /*yield*/, fetch(requestUrl, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': this.credentials.token
                                },
                                body: JSON.stringify({
                                    hardwareId: (hardwareId || '').replace(/-/g, '') // remove dashes, matches rails backend expectations
                                })
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error(response.statusText);
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        responseData = _a.sent();
                        return [2 /*return*/, responseData];
                }
            });
        });
    };
    XRDApi.prototype.getXRDConfig = function (hardwareId) {
        return __awaiter(this, void 0, void 0, function () {
            var xrdId, requestUrl, response, xrdConfig;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        xrdId = (hardwareId || '').replace(/-/g, '');
                        requestUrl = urls.API + xrdConfigPathTemplate.expand({ xrdId: xrdId });
                        return [4 /*yield*/, fetch(requestUrl, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': this.credentials.token
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error(response.statusText);
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        xrdConfig = _a.sent();
                        return [2 /*return*/, xrdConfig];
                }
            });
        });
    };
    XRDApi.prototype.presence = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch(urls.INFO + xrdsPresenceTemplate.expand({ id: this.credentials.user.id }), {
                            headers: [["Authorization", this.credentials.token]]
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error(response.statusText);
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        body = _a.sent();
                        return [2 /*return*/, body];
                }
            });
        });
    };
    XRDApi.prototype.health = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch(urls.C3 + "/health")];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.ok];
                    case 2:
                        error_1 = _a.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return XRDApi;
}(Api));
exports.XRDApi = XRDApi;
