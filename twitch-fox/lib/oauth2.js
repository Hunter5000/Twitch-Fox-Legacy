/*globals window, require, exports: true, module*/

(function () {
    "use strict";
    var root = this, that = {}, localStorage = require("sdk/simple-storage").storage, request, Adapter;

    function noop() {}

    that.adapters = {};

    request = function (opts, callback) {
        if (root.require) {
            opts.method = opts.method.toLowerCase();
            var request = require("sdk/request").Request;
            request({
                url: opts.url,
                content: opts.data,
                onComplete: function (response) {
                    if (response.status === 200) {
                        callback(null, JSON.parse(response.text));
                    } else {
                        callback(response.status);
                    }
                }
            })[opts.method]();
        }
    };

    Adapter = function (id, opts, flow) {
        this.lsPath = "oauth2_" + id;
        this.opts = opts;
        this.responseType = this.opts.response_type;
        this.secret = this.opts.client_secret;
        this.redirect = this.opts.redirect_uri.replace(/https*:\/\//i, "");
        delete this.opts.client_secret;
        this.flow = flow;
        this.codeUrl = opts.api + "?" + this.query(opts);
        this.watchInject();
    };

    Adapter.prototype.watchInject = function () {
        var self = this, injectScript = '(' + this.injectScript.toString() + ')()', injectTo, pageMode = require("sdk/page-mod");

        injectTo = this.redirect + "*";

        //console.log("\n\n\nInjecting\n\n\n");
        pageMode.PageMod({
            include: ["https://" + injectTo, "http://" + injectTo],
            contentScript: injectScript,
            contentScriptWhen: "ready",
            attachTo: "top",
            onAttach: function (worker) {
                //console.log("\n\n\nattached to: " + worker.tab.url);
                worker.port.on("OAUTH2", function (msg) {
                    //console.log("\n\nAuth2 data :", msg)
                    self.finalize(msg.value.params);
                    worker.tab.close();
                });
            }
        });

    };

    Adapter.prototype.injectScript = function () {

        //console.log("\n\nInjecting\n\n");
        var self = window.self, sendMessage = function (msg) {

            var data = {
                value: msg,
                type: "OAUTH2"
            };

            self.port.emit("OAUTH2", data);
        }, send = function () {

            var params = window.location.href;

            //console.log("\nSending back to background message = ", params);

            sendMessage({
                params: params
            });
        };

        send();

    };

    Adapter.prototype.del = function () {
        delete localStorage.followedAuthInfo.token;
    };

    Adapter.prototype.get = function () {
        return localStorage.followedAuthInfo.token;
    };

    Adapter.prototype.set = function (val) {
        localStorage.followedAuthInfo.token = val;
    };

    Adapter.prototype.pick = function (obj, params) {
        var res = {}, i;
        for (i in obj) {
            if (obj.hasOwnProperty(i) && (params.indexOf(i) > -1)) {
                res[i] = obj[i];
            }
        }
        return res;
    };

    Adapter.prototype.query = function (o) {
        var res = [], i;
        for (i in o) {
            if (o.hasOwnProperty(i)) {
                res.push(encodeURIComponent(i) + "=" + encodeURIComponent(o[i]));
            }
        }
        return res.join("&");
    };

    Adapter.prototype.parseAccessToken = function (url) {
        var error = url.match(/[&\?]error=([^&]+)/);
        if (error) {
            throw new Error('Error getting access token: ' + error[1]);
        }
        return url.match(/[&#]access_token=([\w\/\-]+)/)[1];
    };

    Adapter.prototype.parseAuthorizationCode = function (url) {
        var error = url.match(/[&\?]error=([^&]+)/);
        if (error) {
            throw new Error('Error getting authorization code: ' + error[1]);
        }
        return url.match(/[&\?]code=([\w\/\-]+)/)[1];
    };

    Adapter.prototype.authorize = function (callback) {
        this.callback = callback;
        this.openTab(this.codeUrl);
    };

    Adapter.prototype.finalize = function (params) {
        var self = this, callback = self.callback || noop, code, token;

        //console.log("\nSelf response type", self.responseType);
        if (self.responseType === "code") {
            try {
                code = this.parseAuthorizationCode(params);
            } catch (err) {
                //console.log("\n\nerror parsing auth code\n\n");
                return callback(err);
            }

            this.getAccessAndRefreshTokens(code, function (err, data) {
                if (!err) {
                    //console.log("\n\nRecieve access token = ", data.access_token);
                    self.setAccessToken(data.access_token);
                    callback();
                } else {
                    callback(err);
                }
            });
        }

        if (self.responseType === "token") {
            try {
                self.setAccessToken(self.parseAccessToken(params));
            } catch (errr) {
                return callback(errr);
            }
            callback();
        }
    };

    Adapter.prototype.getAccessAndRefreshTokens = function (authorizationCode, callback) {

        var method = this.flow.method, url = this.flow.url, data = this.opts, values;

        data.grant_type = "authorization_code";
        data.code = authorizationCode;
        data.client_secret = this.secret;

        values = this.pick(data, ["client_id", "client_secret", "grant_type", "redirect_uri", "code"]);

        request({
            url: url,
            method: method,
            data: values
        }, callback);
    };

    Adapter.prototype.openTab = function (url) {
        var tabs = require('sdk/tabs');

        tabs.open({
            url: url
        });
    };

    Adapter.prototype.setAccessToken = function (token) {
        this.set(token);
    };

    Adapter.prototype.hasAccessToken = function () {
        var g = this.get();
        return g;
    };

    Adapter.prototype.getAccessToken = function () {
        return this.hasAccessToken() ? this.get() : "";
    };

    that.lookupAdapter = function (url) {
        //console.log("lookup adapter for url = ", url);
        var adapters = that.adapters, i;
        for (i in adapters) {
            if (adapters.hasOwnProperty(i) && adapters[i].opts.redirect_uri === url) {
                return adapters[i];
            }
        }
    };

    that.addAdapter = function (opts) {
        var id = opts.id, adapter = that.adapters[id];
        if (!adapter) {
            adapter = that.adapters[id] = new Adapter(id, opts.opts, opts.codeflow);
        }
        return adapter;
    };

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = that;
        }
        exports.OAuth2 = that;
    } else {
        root.OAuth2 = that;
    }

}());