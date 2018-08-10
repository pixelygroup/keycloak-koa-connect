"use strict";
/**
 * Created by zhangsong on 2018/8/9.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const store = (grant) => {
    return (ctx) => {
        ctx.request.session[SessionStore.TOKEN_KEY] = grant.__raw;
    };
};
const unStore = (ctx) => {
    delete ctx.request.session[SessionStore.TOKEN_KEY];
};
class SessionStore {
    constructor(st) {
        this.store = st;
    }
    get(ctx) {
        return ctx.request.session[SessionStore.TOKEN_KEY];
    }
    clear(sessionId) {
        const self = this;
        this.store.get(sessionId, (err, session) => {
            if (err) {
                console.error(err);
            }
            if (session) {
                delete session[SessionStore.TOKEN_KEY];
                self.store.set(sessionId, session);
            }
        });
    }
    wrap(grant) {
        if (grant) {
            grant.store = store(grant);
            grant.unstore = unStore;
        }
    }
}
SessionStore.TOKEN_KEY = 'keycloak-token';
exports.default = SessionStore;
//# sourceMappingURL=session-store.js.map