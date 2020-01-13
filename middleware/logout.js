"use strict";
/**
 * Created by zhangsong on 2018/8/9.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(keycloak, logoutUrl) {
    return function logout(ctx, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ctx.request.url !== logoutUrl) {
                return yield next();
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
        });
    };
}
exports.default = default_1;
//# sourceMappingURL=logout.js.map