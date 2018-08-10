"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by zhangsong on 2018/8/9.
 */
const store = (grant) => {
    return (ctx) => {
        ctx.session[cookieStore.TOKEN_KEY] = grant.__raw;
    };
};
const unStore = (ctx) => {
    ctx.cookies.set(cookieStore.TOKEN_KEY, '', {
        overwrite: true,
    });
};
const cookieStore = {
    TOKEN_KEY: 'keycloak-token',
    get(ctx) {
        const value = ctx.cookies.get(cookieStore.TOKEN_KEY);
        if (value) {
            try {
                return JSON.parse(value);
            }
            catch (err) {
                // ignore
            }
        }
    },
    wrap(grant) {
        grant.store = store(grant);
        grant.unstore = unStore;
    },
};
exports.default = cookieStore;
//# sourceMappingURL=cookie-store.js.map