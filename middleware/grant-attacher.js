"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by zhangsong on 2018/8/9.
 */
function default_1(keycloak) {
    return function grantAttacher(ctx, next) {
        keycloak.getGrant(ctx)
            .then((grant) => {
            ctx.state.kauth.grant = grant;
        })
            .then(next)
            .catch(() => next());
    };
}
exports.default = default_1;
//# sourceMappingURL=grant-attacher.js.map