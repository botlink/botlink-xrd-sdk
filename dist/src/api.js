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
var url_template_1 = __importDefault(require("url-template"));
var node_fetch_1 = __importDefault(require("node-fetch"));
var urls = __importStar(require("./urls"));
var xrdsPathTemplate = url_template_1.default.parse('/users/{id}/botboxes');
var loginPath = '/sessions/login';
var xrdsPath = function (userId) {
    return xrdsPathTemplate.expand({ id: userId });
};
exports.auth = function (email, password) {
    return node_fetch_1.default(urls.API + loginPath, {
        method: 'POST',
        body: JSON.stringify({
            email: email,
            password: password
        }),
        headers: { 'Content-Type': 'application/json' }
    }).then(function (response) { return response.json(); }).then(function (body) {
        var user = body.user, token = body.token;
        return { user: user, token: token };
    });
};
var Api = /** @class */ (function () {
    function Api(credentials) {
        this.credentials = credentials;
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
        return node_fetch_1.default(urls.API + xrdsPath(this.credentials.user.id), {
            headers: [
                ['Authorization', this.credentials.token]
            ]
        }).then(function (response) { return response.json(); }).then(function (body) {
            return body.map(function (xrd) {
                return {
                    id: xrd.id,
                    hardwareId: xrd.hardwareId,
                    name: xrd.name || xrd.emei
                };
            });
        });
    };
    return XRDApi;
}(Api));
exports.XRDApi = XRDApi;
