"use strict";
/**
 * Created by zhangsong on 2018/8/9.
 */
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(keycloak, logoutUrl) {
    return function logout(ctx, next) {
        if (ctx.request.url !== logoutUrl) {
            return next();
        }
        if (ctx.state.kauth.grant) {
            keycloak.deauthenticated(ctx);
            ctx.state.kauth.grant.unstore(ctx);
            delete ctx.state.kauth.grant;
        }
        const host = ctx.request.hostname;
        const headerHost = ctx.request.host.split(':');
        const port = headerHost[1] || '';
        const redirectUrl = ctx.request.protocol + '://' + host + (port === '' ? '' : ':' + port) + '/';
        const keycloakLogoutUrl = keycloak.logoutUrl(redirectUrl);
        ctx.response.redirect(keycloakLogoutUrl);
    };
}
exports.default = default_1;
//# sourceMappingURL=logout.js.map