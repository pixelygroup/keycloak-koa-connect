/**
 * Created by zhangsong on 2018/8/10.
 */
import * as Koa from 'koa';
import * as KoaRouter from 'koa-router';
import { join } from 'path';
import KeycloakKoaConnect from '../index';

const app = new Koa();

const koaRouter = new KoaRouter();
const appRouter = new KoaRouter();

const keycloakKoaConnect = new KeycloakKoaConnect({}, join(__dirname, '..', 'keycloak.json'));

app.use(...keycloakKoaConnect.middleware());
koaRouter.all('*', (ctx, next) => {
  ctx.body = 'Hello Koa';
});

appRouter.use('/', async (ctx, next) => {
  try {
    await keycloakKoaConnect.protect()(ctx, next);
    await next();
  } catch (e) {
    console.error(e);
  }
}, koaRouter.routes());

app.use(appRouter.routes());

app.listen(3000);
