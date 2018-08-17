"use strict";
/**
 * Created by zhangsong on 2018/8/9.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const bearer_store_1 = require("./stores/bearer-store");
// import CookieStore from './stores/cookie-store';
// import SessionStore from './stores/session-store';
const admin_1 = require("./middleware/admin");
const config_1 = require("./middleware/auth-utils/config");
const grant_manager_1 = require("./middleware/auth-utils/grant-manager");
const grant_attacher_1 = require("./middleware/grant-attacher");
const logout_1 = require("./middleware/logout");
// import PostAuth from './middleware/post-auth';
const protect_1 = require("./middleware/protect");
const setup_1 = require("./middleware/setup");
/**
 * Instantiate a Keycloak.
 *
 * The `config` and `keycloakConfig` hashes are both optional.
 *
 * The `config` hash, if provided, may include either `store`, pointing
 * to the actual session-store used by your application, or `cookies`
 * with boolean `true` as the value to support using cookies as your
 * authentication store.
 *
 * A session-based store is recommended, as it allows more assured control
 * from the Keycloak console to explicitly logout some or all sessions.
 *
 * In all cases, also, authentication through a Bearer authentication
 * header is supported for non-interactive APIs.
 *
 * The `keycloakConfig` object, by default, is populated by the contents of
 * a `keycloak.json` file installed alongside your application, copied from
 * the Keycloak administration console when you provision your application.
 *
 * @constructor
 *
 * @param      {Object}    config          Configuration for the Keycloak connector.
 * @param      {Object}    keycloakConfig  Keycloak-specific configuration.
 *
 * @return     {Keycloak}  A constructed Keycloak object.
 *
 */
class Keycloak {
    // If keycloakConfig is null, Config() will search for `keycloak.json`.
    constructor(config, keycloakConfig) {
        this.config = new config_1.default(keycloakConfig); // 读取配置文件
        this.grantManager = new grant_manager_1.default(this.config); // 设置
        this.stores = [bearer_store_1.default];
        if (!config) {
            throw new Error('Adapter configuration must be provided.');
        }
        // Add the custom scope value
        this.config.scope = config.scope;
        if (config && config.store && config.cookies) {
            throw new Error('Either `store` or `cookies` may be set, but not both');
        }
        // if (config && config.store) {
        //   this.stores.push(new SessionStore(config.store));
        // } else if (config && config.cookies) {
        //   this.stores.push(CookieStore);
        // }
    }
    /**
     * Obtain an array of middleware for use in your application.
     *
     * Generally this should be installed at the root of your application,
     * as it provides general wiring for Keycloak interaction, without actually
     * causing Keycloak to get involved with any particular URL until asked
     * by using `protect(...)`.
     *
     * Example:
     *
     *     var app = express();
     *     var keycloak = new Keycloak();
     *     app.use( keycloak.middleware() );
     *
     * Options:
     *
     *  - `logout` URL for logging a user out. Defaults to `/logout`.
     *  - `admin` Root URL for Keycloak admin callbacks.  Defaults to `/`.
     *
     * @param {Object} options Optional options for specifying details.
     */
    middleware(options) {
        let option = { logout: '', admin: '' };
        if (options) {
            option = options;
        }
        option.logout = option.logout || '/logout';
        option.admin = option.admin || '/';
        const middlewares = [];
        middlewares.push(setup_1.default);
        // middlewares.push(PostAuth(this));
        middlewares.push(admin_1.default(this, option.admin));
        middlewares.push(grant_attacher_1.default(this));
        middlewares.push(logout_1.default(this, option.logout));
        return middlewares;
    }
    protect(spec) {
        return protect_1.default(this, spec);
    }
    authenticated(ctx) {
        // no-op
    }
    eauthenticated(ctx) {
        // no-op
    }
    accessDenied(ctx) {
        ctx.throw(403, 'Access denied');
    }
    getGrant(ctx) {
        let rawData;
        for (const item of this.stores) {
            rawData = item.get(ctx);
            if (rawData) {
                // store = this.stores[i];
                break;
            }
        }
        let grantData = rawData;
        if (typeof (grantData) === 'string') {
            grantData = JSON.parse(grantData);
        }
        if (grantData && !grantData.error) {
            const self = this;
            return this.grantManager.createGrant(JSON.stringify(grantData))
                .then((grant) => {
                self.storeGrant(grant, ctx);
                return grant;
            })
                .catch((e) => {
                return Promise.resolve();
            });
        }
        return Promise.resolve();
    }
    storeGrant(grant, ctx) {
        if (this.stores.length < 2 || bearer_store_1.default.get(ctx)) {
            // cannot store bearer-only, and should not store if grant is from the
            // authorization header
            return;
        }
        if (!grant) {
            this.accessDenied(ctx);
            return;
        }
        this.stores[1].wrap(grant);
        grant.store(ctx);
        return grant;
    }
    unstoreGrant(sessionId) {
        if (this.stores.length < 2) {
            // cannot unstore, bearer-only, this is weird
            return;
        }
        this.stores[1].clear(sessionId);
    }
    getGrantFromCode(code, ctx) {
        if (this.stores.length < 2) {
            // bearer-only, cannot do this;
            throw new Error('Cannot exchange code for grant in bearer-only mode');
        }
        const sessionId = ctx.session.id;
        const self = this;
        return this.grantManager.obtainFromCode(ctx, code, sessionId)
            .then((grant) => {
            self.storeGrant(grant, ctx);
            return grant;
        });
    }
    // 组成登录的 URL 重定向过去
    loginUrl(uuid, redirectUrl) {
        return this.config.realmUrl +
            '/protocol/openid-connect/auth' +
            '?client_id=' + encodeURIComponent(this.config.clientId) +
            '&state=' + encodeURIComponent(uuid) +
            '&redirect_uri=' + encodeURIComponent(redirectUrl) +
            '&scope=' + encodeURIComponent(this.config.scope ? 'openid ' + this.config.scope : 'openid') +
            '&response_type=code';
    }
    logoutUrl(redirectUrl) {
        return this.config.realmUrl +
            '/protocol/openid-connect/logout' +
            '?redirect_uri=' + encodeURIComponent(redirectUrl);
    }
    accountUrl() {
        return this.config.realmUrl + '/account';
    }
    getAccount(token) {
        return this.grantManager.getAccount(token);
    }
    redirectToLogin(ctx) {
        return !this.config.bearerOnly;
    }
}
exports.default = Keycloak;
//# sourceMappingURL=index.js.map