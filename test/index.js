"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by zhangsong on 2018/8/10.
 */
const Koa = require("koa");
const index_1 = require("../index");
const app = new Koa();
const keycloakKoaConnect = new index_1.default();
app.use();
// response
app.use((ctx) => {
    ctx.body = 'Hello Koa';
});
app.listen(3000);
//# sourceMappingURL=index.js.map