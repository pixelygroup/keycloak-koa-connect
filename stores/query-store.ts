/**
 * Created by zhangsong on 2018/9/14.
 */

const bearerStore = {
    get(ctx) {
        if (!ctx.request.query || !ctx.request.query.jwt) {
            return
        }
        const {jwt} = ctx.request.query;
        if (jwt) {
            return {
                access_token: jwt,
            };
        }
    },
};

export default bearerStore;
