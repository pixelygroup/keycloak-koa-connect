"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by zhangsong on 2018/8/9.
 */
const crypto = require("crypto");
const http = require("http");
const https = require("https");
const querystring = require("querystring");
const URL = require("url");
const grant_1 = require("./grant");
const rotation_1 = require("./rotation");
const token_1 = require("./token");
// 获取请求协议
const getProtocol = (opts) => {
    return opts.protocol === 'https:' ? https : http;
};
const nodeify = (promise, cb) => {
    if (typeof cb !== 'function') {
        return promise;
    }
    return promise.then((res) => cb(null, res))
        .catch((err) => cb(err));
};
const createHandler = (manager) => (resolve, reject, json) => {
    try {
        resolve(manager.createGrant(json));
    }
    catch (err) {
        reject(err);
    }
};
const refreshHandler = (manager, grant) => (resolve, reject, json) => {
    manager.createGrant(json)
        .then((grants) => resolve(grants))
        .catch((err) => reject(err));
};
const validationHandler = (manager, token) => (resolve, reject, json) => {
    const data = JSON.parse(json);
    if (!data.active) {
        resolve(false);
    }
    else {
        resolve(token);
    }
};
const postOptions = (manager, path) => {
    const realPath = path || '/protocol/openid-connect/token';
    const opts = URL.parse(manager.realmUrl + realPath);
    opts.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Client': 'keycloak-nodejs-connect',
    };
    if (!manager.public) {
        opts.headers.Authorization = 'Basic ' + new Buffer(manager.clientId + ':' + manager.secret).toString('base64');
    }
    opts.method = 'POST';
    return opts;
};
const fetch = (manager, handler, options, params) => {
    return new Promise((resolve, reject) => {
        const data = (typeof params === 'string' ? params : querystring.stringify(params));
        options.headers['Content-Length'] = data.length;
        const req = getProtocol(options)
            .request(options, (response) => {
            if (response.statusCode < 200 || response.statusCode > 299) {
                return reject(response.statusCode + ':' + http.STATUS_CODES[response.statusCode]);
            }
            let json = '';
            response.on('data', (d) => (json += d.toString()));
            response.on('end', () => {
                handler(resolve, reject, json);
            });
        });
        req.write(data);
        req.on('error', reject);
        req.end();
    });
};
/**
 * Construct a grant manager.
 *
 * @param {Config} config Config object.
 *
 * @constructor
 */
class GrantManager {
    constructor(config) {
        this.realmUrl = config.realmUrl;
        this.clientId = config.clientId;
        this.secret = config.secret;
        this.publicKey = config.publicKey;
        this.public = config.public;
        this.bearerOnly = config.bearerOnly;
        this.notBefore = 0;
        this.rotation = new rotation_1.default(config);
    }
    /**
     * Use the direct grant API to obtain a grant from Keycloak.
     *
     * The direct grant API must be enabled for the configured realm
     * for this method to work. This function ostensibly provides a
     * non-interactive, programatic way to login to a Keycloak realm.
     *
     * This method can either accept a callback as the last parameter
     * or return a promise.
     *
     * @param {String} username The username.
     * @param {String} password The cleartext password.
     * @param {Function} callback Optional callback, if not using promises.
     * @param {String} scopeParam 作用域
     */
    obtainDirectly(username, password, callback, scopeParam) {
        const params = {
            username,
            password,
            client_id: this.clientId,
            grant_type: 'password',
            scope: scopeParam || 'openid',
        };
        const handler = createHandler(this);
        const options = postOptions(this);
        return nodeify(fetch(this, handler, options, params), callback);
    }
    /**
     * Obtain a grant from a previous interactive login which results in a code.
     *
     * This is typically used by servers which receive the code through a
     * redirect_uri when sending a user to Keycloak for an interactive login.
     *
     * An optional session ID and host may be provided if there is desire for
     * Keycloak to be aware of this information.  They may be used by Keycloak
     * when session invalidation is triggered from the Keycloak console itself
     * during its postbacks to `/k_logout` on the server.
     *
     * This method returns or promise or may optionally take a callback function.
     *
     * @param {Object} ctx
     * @param {String} code The code from a successful login redirected from Keycloak.
     * @param {String} sessionId Optional opaque session-id.
     * @param {String} sessionHost Optional session host for targetted Keycloak console post-backs.
     * @param {Function} callback Optional callback, if not using promises.
     */
    obtainFromCode(ctx, code, sessionId, sessionHost, callback) {
        const params = {
            code,
            client_session_state: sessionId,
            client_session_host: sessionHost,
            grant_type: 'authorization_code',
            client_id: this.clientId,
            redirect_uri: ctx.session ? ctx.session.auth_redirect_uri : {},
        };
        const handler = createHandler(this);
        const options = postOptions(this);
        return nodeify(fetch(this, handler, options, params), callback);
    }
    /**
     * Obtain a service account grant.
     * Client option 'Service Accounts Enabled' needs to be on.
     *
     * This method returns or promise or may optionally take a callback function.
     *
     * @param {Function} callback Optional callback, if not using promises.
     * @param {String} scopeParam
     */
    obtainFromClientCredentials(callback, scopeParam) {
        const params = {
            grant_type: 'client_credentials',
            scope: scopeParam || 'openid',
            client_id: this.clientId,
        };
        const handler = createHandler(this);
        const options = postOptions(this);
        return nodeify(fetch(this, handler, options, params), callback);
    }
    /**
     * Ensure that a grant is *fresh*, refreshing if required & possible.
     *
     * If the access_token is not expired, the grant is left untouched.
     *
     * If the access_token is expired, and a refresh_token is available,
     * the grant is refreshed, in place (no new object is created),
     * and returned.
     *
     * If the access_token is expired and no refresh_token is available,
     * an error is provided.
     *
     * The method may either return a promise or take an optional callback.
     *
     * @param {Grant} grant The grant object to ensure freshness of.
     * @param {Function} callback Optional callback if promises are not used.
     */
    ensureFreshness(grant, callback) {
        if (!grant.isExpired()) {
            return nodeify(Promise.resolve(grant), callback);
        }
        if (!grant.refreshToken) {
            return nodeify(Promise.reject(new Error('Unable to refresh without a refresh token')), callback);
        }
        if (grant.refreshToken.isExpired()) {
            return nodeify(Promise.reject(new Error('Unable to refresh with expired refresh token')), callback);
        }
        const params = {
            grant_type: 'refresh_token',
            refresh_token: grant.refreshToken.token,
            client_id: this.clientId,
        };
        const handler = refreshHandler(this, grant);
        const options = postOptions(this);
        return nodeify(fetch(this, handler, options, params), callback);
    }
    /**
     * Perform live validation of an `access_token` against the Keycloak server.
     *
     * @param {Token|String} token The token to validate.
     * @param {Function} callback Callback function if not using promises.
     *
     * @return {boolean} `false` if the token is invalid, or the same token if valid.
     */
    validateAccessToken(token, callback) {
        let t = token;
        if (typeof token === 'object') {
            t = token.token;
        }
        const params = {
            token: t,
            client_secret: this.secret,
            client_id: this.clientId,
        };
        const options = postOptions(this, '/protocol/openid-connect/token/introspect');
        const handler = validationHandler(this, token);
        return nodeify(fetch(this, handler, options, params), callback);
    }
    userInfo(token, callback) {
        const url = this.realmUrl + '/protocol/openid-connect/userinfo';
        const options = URL.parse(url);
        options.method = 'GET';
        let t = token;
        if (typeof token === 'object') {
            t = token.token;
        }
        options.headers = {
            'Authorization': 'Bearer ' + t,
            'Accept': 'application/json',
            'X-Client': 'keycloak-nodejs-connect',
        };
        const promise = new Promise((resolve, reject) => {
            const req = getProtocol(options)
                .request(options, (response) => {
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    return reject('Error fetching account');
                }
                let json = '';
                response.on('data', (d) => (json += d.toString()));
                response.on('end', () => {
                    const data = JSON.parse(json);
                    if (data.error) {
                        reject(data);
                    }
                    else {
                        resolve(data);
                    }
                });
            });
            req.on('error', reject);
            req.end();
        });
        return nodeify(promise, callback);
    }
    getAccount() {
        console.error('GrantManager#getAccount is deprecated. See GrantManager#userInfo');
        return this.userInfo.apply(this, arguments);
    }
    isGrantRefreshable(grant) {
        return !this.bearerOnly && (grant && grant.refreshToken);
    }
    /**
     * Create a `Grant` object from a string of JSON data.
     *
     * This method creates the `Grant` object, including
     * the `access_token`, `refresh_token` and `id_token`
     * if available, and validates each for expiration and
     * against the known public-key of the server.
     *
     * @param {String} rawData The raw JSON string received from the Keycloak server or from a client.
     * @return {Promise} A promise reoslving a grant.
     */
    createGrant(rawData) {
        let grantData = rawData;
        if (typeof rawData !== 'object') {
            grantData = JSON.parse(grantData);
        }
        const grant = new grant_1.default({
            access_token: (grantData.access_token ? new token_1.default(grantData.access_token, this.clientId) : undefined),
            refresh_token: (grantData.refresh_token ? new token_1.default(grantData.refresh_token) : undefined),
            id_token: (grantData.id_token ? new token_1.default(grantData.id_token) : undefined),
            expires_in: grantData.expires_in,
            token_type: grantData.token_type,
            __raw: rawData,
        });
        if (this.isGrantRefreshable(grant)) {
            return new Promise((resolve, reject) => {
                this.ensureFreshness(grant)
                    .then((g) => this.validateGrant(g))
                    .then((g) => resolve(g))
                    .catch((err) => reject(err));
            });
        }
        else {
            return this.validateGrant(grant);
        }
    }
    validateGrant(grant) {
        const self = this;
        const validateGrantToken = (grants, tokenName) => {
            return new Promise((resolve, reject) => {
                // check the access token
                this.validateToken(grant[tokenName])
                    .then((token) => {
                    grants[tokenName] = token;
                    resolve(true);
                })
                    .catch((err) => {
                    reject(new Error('Grant validation failed. Reason: ' + err.message));
                });
            });
        };
        return new Promise((resolve, reject) => {
            const promises = [];
            promises.push(validateGrantToken(grant, 'accessToken'));
            if (!self.bearerOnly) {
                if (grant.refreshToken) {
                    promises.push(validateGrantToken(grant, 'refreshToken'));
                }
                if (grant.idToken) {
                    promises.push(validateGrantToken(grant, 'idToken'));
                }
            }
            Promise.all(promises)
                .then(() => {
                resolve(grant);
            })
                .catch((err) => {
                reject(new Error(err.message));
            });
        });
    }
    /**
     * Validate a token.
     *
     * This method accepts a token, and returns a promise
     *
     * If the token is valid the promise will be resolved with the token
     *
     * If any of the following errors are seen the promise will resolve with undefined:
     *
     * - The token was undefined in the first place.
     * - The token is expired.
     * - The token is not expired, but issued before the current *not before* timestamp.
     * - The token signature does not verify against the known realm public-key.
     *
     * @return {Promise} That resolve a token
     */
    validateToken(token) {
        return new Promise((resolve, reject) => {
            if (!token) {
                reject(new Error('invalid token (missing)'));
            }
            else if (token.isExpired()) {
                reject(new Error('invalid token (expired)'));
            }
            else if (!token.signed) {
                reject(new Error('invalid token (not signed)'));
            }
            else if (token.content.iat < this.notBefore) {
                reject(new Error('invalid token (future dated)'));
            }
            else if (token.content.iss !== this.realmUrl) {
                reject(new Error('invalid token (wrong ISS)'));
            }
            else {
                const verify = crypto.createVerify('RSA-SHA256');
                // if public key has been supplied use it to validate token
                if (this.publicKey) {
                    try {
                        verify.update(token.signed);
                        if (!verify.verify(this.publicKey, token.signature, 'base64')) {
                            reject(new Error('invalid token (signature)'));
                        }
                        else {
                            resolve(token);
                        }
                    }
                    catch (err) {
                        reject(new Error('Misconfigured parameters while validating token. Check your keycloak.json file!'));
                    }
                }
                else {
                    // retrieve public KEY and use it to validate token
                    this.rotation.getJWK(token.header.kid)
                        .then((key) => {
                        verify.update(token.signed);
                        if (!verify.verify(key, token.signature)) {
                            reject(new Error('invalid token (public key signature)'));
                        }
                        else {
                            resolve(token);
                        }
                    })
                        .catch((err) => {
                        reject(new Error('failed to load public key to verify token. Reason: ' + err.message));
                    });
                }
            }
        });
    }
}
exports.default = GrantManager;
//# sourceMappingURL=grant-manager.js.map