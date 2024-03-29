#include "botlink_api_wrapper.h"

#include <napi.h>

#include <functional>
#include <optional>
#include <utility>

namespace {

template<class T>
class RequestWorker : public Napi::AsyncWorker {
public:
    RequestWorker(Napi::Env& env,
                  Napi::Promise::Deferred&& deferred,
                  std::function<T()> action)
    : Napi::AsyncWorker(env)
    , _deferred(deferred)
    , _action(action)
    {}

    void Execute()
    {
        try {
            _result = _action();
        } catch (const botlink::Public::exception::BotlinkRuntime& e) {
            SetError(e.what());
        } catch (const botlink::Public::exception::BotlinkLogic& e) {
            SetError(e.what());
        }
    }

    void OnOK()
    {
        resolveOnOk(_result);
    }

    void OnError(const Napi::Error& error)
    {
        _deferred.Reject(error.Value());
    }

private:
    Napi::Promise::Deferred _deferred;
    T _result;
    std::function<T()> _action;

    void resolveOnOk(bool result)
    {
        _deferred.Resolve(Napi::Boolean::New(Env(), result));
    }

    void resolveOnOk(const std::vector<botlink::Public::Xrd>& result)
    {
        auto array = Napi::Array::New(Env(), result.size());
        for (uint32_t i = 0; i < result.size(); ++i) {
            auto xrd = Napi::Object::New(Env());
            auto hardwareId = Napi::String::New(Env(), result[i].hardwareId);
            auto id = Napi::Number::New(Env(), result[i].id);
            auto name = Napi::String::New(Env(), result[i].name);
            xrd.Set("hardwareId", hardwareId);
            xrd.Set("id", id);
            xrd.Set("name", name);
            array[i] = xrd;
        }
        _deferred.Resolve(array);
    }

    void resolveOnOk(const std::string&result)
    {
        _deferred.Resolve(Napi::String::New(Env(), result));
    }

};

}

namespace botlink {
namespace wrapper {

Napi::Object BotlinkApi::Init(Napi::Env env, Napi::Object exports)
{
    Napi::Function func =
        DefineClass(env,
                    "BotlinkApi",
                    {InstanceMethod("login", &BotlinkApi::login),
                     InstanceMethod("refresh", &BotlinkApi::refresh),
                     InstanceMethod("listXrds", &BotlinkApi::listXrds),
                     InstanceMethod("getRefreshToken", &BotlinkApi::getRefreshToken),
                     InstanceMethod("getAuthToken", &BotlinkApi::getAuthToken),
                     InstanceMethod("registerXrd", &BotlinkApi::registerXrd),
                     InstanceMethod("deregisterXrd", &BotlinkApi::deregisterXrd),
                     InstanceMethod("updateXrdName", &BotlinkApi::updateXrdName)});

    Napi::FunctionReference* constructor = new Napi::FunctionReference;
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);

    exports.Set("BotlinkApi", func);
    return exports;
}

BotlinkApi::BotlinkApi(const Napi::CallbackInfo& info)
: Napi::ObjectWrap<BotlinkApi>(info)
{
    Napi::Function emit = info.This().As<Napi::Object>().Get("emit")
        .As<Napi::Function>();
    Napi::Function bound = emit.Get("bind").As<Napi::Function>()
        .Call(emit, { info.This() }).As<Napi::Function>();

    // Create ThreadSafeFunction so we don't have to worry about which thread
    // calls "emit".
    Napi::ThreadSafeFunction workerFn = Napi::ThreadSafeFunction::New(
        info.Env(),
        bound,         // JavaScript function called asynchronously
        "New Token Emitter", // Name
        0,             // Unlimited queue
        1,             // Only one thread will use this initially
        []( Napi::Env ) { // Finalizer
            // Do nothing.
        } );

    // callbackSdk gets called by the C++ SDK
    auto callbackSdk = [emitter = std::move(workerFn)] (const std::string& auth,
                                                        const std::string& refresh) -> void {
        // nodeCallback gets called on Node's main thread
        auto nodeCallback = [](Napi::Env env, Napi::Function jsCallback,
                               std::pair<std::string, std::string>* tokens) {
            auto jsTokens = Napi::Object::New(env);
            jsTokens.Set("auth", Napi::Value::From(env, tokens->first));
            jsTokens.Set("refresh", Napi::Value::From(env, tokens->second));
            delete tokens;
            // The event name here needs to match the BotlinkApiEvents.NewTokens
            // name in binding.ts.
            jsCallback.Call({Napi::String::New(env, "NewTokens"), jsTokens});
        };
        auto tokens = std::make_unique<std::pair<std::string, std::string>>(auth, refresh);
        // This schedules nodeCallback to be called on Node's main thread.
        napi_status status = emitter.BlockingCall(tokens.release(), nodeCallback);
        if (status != napi_ok) {
            // TODO(cgrahn): Handle error
        }
    };

    _api.setNewTokenCallback(callbackSdk);
}


Napi::Value BotlinkApi::login(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    constexpr size_t maxArgs = 2;
    if (info.Length() > maxArgs) {
        Napi::TypeError::New(env, "Too many arguments")
            .ThrowAsJavaScriptException();
    }

    constexpr size_t minArgs = 1;
    if (info.Length() < minArgs) {
        Napi::TypeError::New(env, "Too few arguments")
            .ThrowAsJavaScriptException();
    }

    std::string usernameOrToken;
    std::optional<std::string> password;
    std::optional<std::chrono::seconds> timeout;

    // username or token
    const auto& arg0 = info[0];
    if (!arg0.IsObject()) {
        Napi::TypeError::New(env, "Wrong argument for first argument. "
                             "Expected ApiLogin object.")
            .ThrowAsJavaScriptException();
    }

    try {
        auto loginCredentials = arg0.As<Napi::Object>();
        if (loginCredentials.Has("token")) {
            usernameOrToken = loginCredentials.Get("token").As<Napi::String>();
        } else if (loginCredentials.Has("username") &&
                   loginCredentials.Has("password")) {
            usernameOrToken = loginCredentials.Get("username").As<Napi::String>();
            password = loginCredentials.Get("password").As<Napi::String>();
        } else {
            Napi::TypeError::New(env, "ApiLogin object needs to contain token "
                                 "or username and password.")
                .ThrowAsJavaScriptException();
        }
    } catch (const Napi::Error& error) {
        Napi::Error::New(env, "Got exception parsing ApiLogin object: " +
                         error.Message())
            .ThrowAsJavaScriptException();
    }

    if (info.Length() == maxArgs) {
        const auto& arg1 = info[1];
        if (arg1.IsNumber()) {
            timeout = std::chrono::seconds(arg1.As<Napi::Number>());
        } else {
            Napi::TypeError::New(env, "Wrong argument for second argument. "
                                 "Expected string for password or number for timeout in seconds.")
                .ThrowAsJavaScriptException();
        }
    }

    // This creates a function here which is then used to perform the
    // entire connection process on a worker thread. That way any HTTP
    // requests made by login() don't block node.js's main thread.
    // TODO(cgrahn): Update here if/when BotlinkApi class is non-blocking
    auto loginFn = [&api = _api, usernameOrToken, password, timeout] () {
        if (password) {
            if (timeout) {
                api.login(usernameOrToken, *password, *timeout);
            } else {
                api.login(usernameOrToken, *password);
            }
        } else {
            if (timeout) {
                api.login(usernameOrToken, *timeout);
            } else {
                api.login(usernameOrToken);
            }
        }
        return true; };

    auto deferred = Napi::Promise::Deferred::New(env);

    // node.js garbage collects this
    auto* worker = new RequestWorker<bool>(env, std::move(deferred), loginFn);
    worker->Queue();

    return deferred.Promise();
}

Napi::Value BotlinkApi::refresh(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    constexpr size_t maxArgs = 1;
    if (info.Length() > maxArgs) {
        Napi::TypeError::New(env, "Too many arguments")
            .ThrowAsJavaScriptException();
    }

    std::optional<std::chrono::seconds> timeout;

    if (info.Length() == maxArgs) {
        const auto& arg0 = info[0];
        if (arg0.IsNumber()) {
            timeout = std::chrono::seconds(arg0.As<Napi::Number>());
        } else {
            Napi::TypeError::New(env, "Wrong argument for second argument. "
                                 "Expected number for timeout in seconds.")
                .ThrowAsJavaScriptException();
        }
    }

    // create function here and perform entire connection process on worker
    // thread so that any HTTP requests by refresh() won't block
    // node.js's main thread.
    // TODO(cgrahn): Update here if/when BotlinkApi class is non-blocking
    auto refreshFn = [&api = _api, timeout] () {
        if (timeout) {
            api.refresh(*timeout);
        } else {
            api.refresh();
        }
        return true; };

    auto deferred = Napi::Promise::Deferred::New(env);

    // node.js garbage collects this
    auto* worker = new RequestWorker<bool>(env, std::move(deferred), refreshFn);
    worker->Queue();

    return deferred.Promise();
}

Napi::Value BotlinkApi::listXrds(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    constexpr size_t maxArgs = 1;
    if (info.Length() > maxArgs) {
        Napi::TypeError::New(env, "Too many arguments")
            .ThrowAsJavaScriptException();
    }

    std::optional<std::chrono::seconds> timeout;

    if (info.Length() == maxArgs) {
        const auto& arg0 = info[0];
        if (arg0.IsNumber()) {
            timeout = std::chrono::seconds(arg0.As<Napi::Number>());
        } else {
            Napi::TypeError::New(env, "Wrong argument for second argument. "
                                 "Expected number for timeout in seconds.")
                .ThrowAsJavaScriptException();
        }
    }

    // create function here and perform entire connection process on worker
    // thread so that any HTTP requests by listXrds() won't block
    // node.js's main thread.
    // TODO(cgrahn): Update here if/when BotlinkApi class is non-blocking
    auto listFn = [&api = _api, timeout] () {
        if (timeout) {
            return api.listXrds(*timeout);
        } else {
            return api.listXrds();
        }};

    auto deferred = Napi::Promise::Deferred::New(env);

    // node.js garbage collects this
    auto* worker = new RequestWorker<std::vector<botlink::Public::Xrd>>(env, std::move(deferred), listFn);
    worker->Queue();

    return deferred.Promise();
}

Napi::Value BotlinkApi::getRefreshToken(const Napi::CallbackInfo& info)
{
    // TODO(cgrahn): Commonize this timeout checking code
    Napi::Env env = info.Env();
    constexpr size_t maxArgs = 1;
    if (info.Length() > maxArgs) {
        Napi::TypeError::New(env, "Too many arguments")
            .ThrowAsJavaScriptException();
    }

    std::optional<std::chrono::seconds> timeout;

    if (info.Length() == maxArgs) {
        const auto& arg0 = info[0];
        if (arg0.IsNumber()) {
            timeout = std::chrono::seconds(arg0.As<Napi::Number>());
        } else {
            Napi::TypeError::New(env, "Wrong argument for second argument. "
                                 "Expected number for timeout in seconds.")
                .ThrowAsJavaScriptException();
        }
    }

    // create function here and perform token fetching on worker
    // thread so that any HTTP requests by getRefreshToken() won't
    // block node.js's main thread.
    // TODO(cgrahn): Update here if/when BotlinkApi class is non-blocking
    auto tokenFn = [&api = _api, timeout] () {
        if (timeout) {
            return api.getRefreshToken(*timeout);
        } else {
            return api.getRefreshToken();
        }};

    auto deferred = Napi::Promise::Deferred::New(env);

    // node.js garbage collects this
    auto* worker = new RequestWorker<std::string>(env, std::move(deferred), tokenFn);
    worker->Queue();

    return deferred.Promise();
}

Napi::Value BotlinkApi::getAuthToken(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    constexpr size_t maxArgs = 1;
    if (info.Length() > maxArgs) {
        Napi::TypeError::New(env, "Too many arguments")
            .ThrowAsJavaScriptException();
    }

    std::optional<std::chrono::seconds> timeout;

    if (info.Length() == maxArgs) {
        const auto& arg0 = info[0];
        if (arg0.IsNumber()) {
            timeout = std::chrono::seconds(arg0.As<Napi::Number>());
        } else {
            Napi::TypeError::New(env, "Wrong argument for second argument. "
                                 "Expected number for timeout in seconds.")
                .ThrowAsJavaScriptException();
        }
    }

    // create function here and perform token fetching on worker
    // thread so that any HTTP requests by getAuthToken() won't block
    // node.js's main thread.
    // TODO(cgrahn): Update here if/when BotlinkApi class is non-blocking
    auto tokenFn = [&api = _api, timeout] () {
        if (timeout) {
            return api.getAuthToken(*timeout);
        } else {
            return api.getAuthToken();
        }};

    auto deferred = Napi::Promise::Deferred::New(env);

    // node.js garbage collects this
    auto* worker = new RequestWorker<std::string>(env, std::move(deferred), tokenFn);
    worker->Queue();

    return deferred.Promise();
}

Napi::Value BotlinkApi::registerXrd(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    constexpr size_t maxArgs = 2;
    if (info.Length() > maxArgs) {
        Napi::TypeError::New(env, "Too many arguments")
            .ThrowAsJavaScriptException();
    }

    const auto& arg0 = info[0];
    if (!arg0.IsString()) {
            Napi::TypeError::New(env, "Wrong argument for first argument. "
                                 "Expected XRD hardware ID as string.")
                .ThrowAsJavaScriptException();

    }

    std::string xrdId = arg0.As<Napi::String>();

    std::optional<std::chrono::seconds> timeout;
    if (info.Length() == maxArgs) {
        const auto& arg1 = info[1];
        if (arg1.IsNumber()) {
            timeout = std::chrono::seconds(arg1.As<Napi::Number>());
        } else {
            Napi::TypeError::New(env, "Wrong argument for second argument. "
                                 "Expected number for timeout in seconds.")
                .ThrowAsJavaScriptException();
        }
    }

    // create function here and perform registration on worker thread
    // so that any HTTP requests won't block node.js's main thread.
    auto registerFn = [&api = _api, xrdId, timeout] () -> bool {
        if (timeout) {
            return api.registerXrd(xrdId, *timeout);
        } else {
            return api.registerXrd(xrdId);
        }};

    auto deferred = Napi::Promise::Deferred::New(env);

    // node.js garbage collects this
    auto* worker = new RequestWorker<bool>(env, std::move(deferred), registerFn);
    worker->Queue();

    return deferred.Promise();
}

Napi::Value BotlinkApi::deregisterXrd(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    constexpr size_t maxArgs = 2;
    if (info.Length() > maxArgs) {
        Napi::TypeError::New(env, "Too many arguments")
            .ThrowAsJavaScriptException();
    }

    const auto& xrdJs = info[0];
    Public::Xrd xrd = xrdJsToCxx(env, xrdJs);

    std::optional<std::chrono::seconds> timeout;
    if (info.Length() == maxArgs) {
        const auto& arg1 = info[1];
        if (arg1.IsNumber()) {
            timeout = std::chrono::seconds(arg1.As<Napi::Number>());
        } else {
            Napi::TypeError::New(env, "Wrong argument for second argument. "
                                 "Expected number for timeout in seconds.")
                .ThrowAsJavaScriptException();
        }
    }

    // create function here and perform deregistration on worker thread
    // so that any HTTP requests won't block node.js's main thread.
    auto deregisterFn = [&api = _api, xrd, timeout] () -> bool {
        if (timeout) {
            return api.deregisterXrd(xrd, *timeout);
        } else {
            return api.deregisterXrd(xrd);
        }};

    auto deferred = Napi::Promise::Deferred::New(env);

    // node.js garbage collects this
    auto* worker = new RequestWorker<bool>(env, std::move(deferred), deregisterFn);
    worker->Queue();

    return deferred.Promise();
}

Napi::Value BotlinkApi::updateXrdName(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    constexpr size_t maxArgs = 3;
    if (info.Length() > maxArgs) {
        Napi::TypeError::New(env, "Too many arguments")
            .ThrowAsJavaScriptException();
    }

    const auto& xrdJs = info[0];
    Public::Xrd xrd = xrdJsToCxx(env, xrdJs);

    const auto& arg1 = info[1];
    if (!arg1.IsString()) {
            Napi::TypeError::New(env, "Wrong argument for second argument. "
                                 "Expected new name for XRD as string.")
                .ThrowAsJavaScriptException();

    }

    std::string newName = arg1.As<Napi::String>();

    std::optional<std::chrono::seconds> timeout;
    if (info.Length() == maxArgs) {
        const auto& arg2 = info[2];
        if (arg2.IsNumber()) {
            timeout = std::chrono::seconds(arg2.As<Napi::Number>());
        } else {
            Napi::TypeError::New(env, "Wrong argument for third argument. "
                                 "Expected number for timeout in seconds.")
                .ThrowAsJavaScriptException();
        }
    }

    // create function here and perform name update on worker thread
    // so that any HTTP requests won't block node.js's main thread.
    auto updateNameFn = [&api = _api, xrd, newName, timeout] () -> bool {
        if (timeout) {
            return api.updateXrdName(xrd, newName, *timeout);
        } else {
            return api.updateXrdName(xrd, newName);
        }};

    auto deferred = Napi::Promise::Deferred::New(env);

    // node.js garbage collects this
    auto* worker = new RequestWorker<bool>(env, std::move(deferred), updateNameFn);
    worker->Queue();

    return deferred.Promise();
}

botlink::Public::BotlinkApi& BotlinkApi::getApi()
{
    return _api;
}

botlink::Public::Xrd xrdJsToCxx(Napi::Env& env, const Napi::Value& xrdJs)
{
    if (!xrdJs.IsObject()) {
        Napi::TypeError::New(env, "Wrong argument for XRD. "
                             "Expected object.")
            .ThrowAsJavaScriptException();
    }

    Public::Xrd xrd;
    // The XRD does not always have a name assigned in the backend database. So
    // handle exception here (usually caused by "name" being set to undefined or
    // null).
    try {
        xrd.name = xrdJs.As<Napi::Object>().Get("name").As<Napi::String>();
    } catch (Napi::Error& e) {
        (void) e;
        xrd.name = "";
    }
    xrd.hardwareId = xrdJs.As<Napi::Object>().Get("hardwareId").As<Napi::String>();
    xrd.id = xrdJs.As<Napi::Object>().Get("id").As<Napi::Number>().Int32Value();

    return xrd;
}

}
}
