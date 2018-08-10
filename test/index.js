"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by zhangsong on 2018/8/10.
 */
const Koa = require("koa");
const KoaRouter = require("koa-router");
const path_1 = require("path");
const index_1 = require("../index");
const app = new Koa();
const koaRouter = new KoaRouter();
const appRouter = new KoaRouter();
const keycloakKoaConnect = new index_1.default({}, path_1.join(__dirname, '..', 'keycloak.json'));
app.use(...keycloakKoaConnect.middleware());
koaRouter.all('*', (ctx, next) => {
    ctx.body = 'Hello Koa';
});
appRouter.use('/', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        yield keycloakKoaConnect.protect()(ctx, next);
        yield next();
    }
    catch (e) {
        console.error(e);
    }
}), koaRouter.routes());
app.use(appRouter.routes());
// // response
// app.use((ctx) => {
//   ctx.body = 'Hello Koa';
// });
app.listen(3000);
//# sourceMappingURL=index.js.map