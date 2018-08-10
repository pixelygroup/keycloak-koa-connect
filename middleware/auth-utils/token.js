"use strict";
/**
 * Created by zhangsong on 2018/8/9.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Construct a token.
 *
 * Based on a JSON Web Token string, construct a token object. Optionally
 * if a `clientId` is provided, the token may be tested for roles with
 * `hasRole()`.
 *
 * @constructor
 *
 * @param {String} token The JSON Web Token formatted token string.
 * @param {String} clientId Optional clientId if this is an `access_token`.
 */
class Token {
    constructor(token, clientId) {
        this.token = token;
        this.clientId = clientId;
        if (token) {
            try {
                const parts = token.split('.');
                this.header = JSON.parse(new Buffer(parts[0], 'base64').toString());
                this.content = JSON.parse(new Buffer(parts[1], 'base64').toString());
                this.signature = new Buffer(parts[2], 'base64');
                this.signed = parts[0] + '.' + parts[1];
            }
            catch (err) {
                this.content = {
                    exp: 0,
                };
            }
        }
    }
    /**
     * Determine if this token is expired.
     * @return {boolean} `true` if it is expired, otherwise `false`.
     */
    isExpired() {
        return (this.content.exp * 1000) < Date.now();
    }
    hasRole(name) {
        if (!this.clientId) {
            return false;
        }
        const parts = name.split(':');
        if (parts.length === 1) {
            return this.hasApplicationRole(this.clientId, parts[0]);
        }
        if (parts[0] === 'realm') {
            return this.hasRealmRole(parts[1]);
        }
        return this.hasApplicationRole(parts[0], parts[1]);
    }
    hasApplicationRole(appName, roleName) {
        const appRoles = this.content.resource_access[appName];
        if (!appRoles) {
            return false;
        }
        return (appRoles.roles.indexOf(roleName) >= 0);
    }
    hasRealmRole(roleName) {
        // Make sure we have these properties before we check for a certain realm level role!
        // Without this we attempt to access an undefined property on token
        // for a user with no realm level roles.
        if (!this.content.realm_access || !this.content.realm_access.roles) {
            return false;
        }
        return (this.content.realm_access.roles.indexOf(roleName) >= 0);
    }
}
exports.default = Token;
//# sourceMappingURL=token.js.map