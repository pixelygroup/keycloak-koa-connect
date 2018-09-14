"use strict";
/**
 * Created by zhangsong on 2018/9/14.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const bodyStore = {
    get(ctx) {
        const { jwt } = ctx.request.body;
        if (jwt) {
            return {
                access_token: jwt,
            };
        }
    },
};
exports.default = bodyStore;
//# sourceMappingURL=body-store.js.map