/**
 * Created by zhangsong on 2018/8/10.
 */
import * as Koa from 'koa';
import KeycloakKoaConnect from '../index';

const app = new Koa();

const keycloakKoaConnect = new KeycloakKoaConnect();

app.use();

// response
app.use((ctx) => {
  ctx.body = 'Hello Koa';
});

app.listen(3000);
