# keycloak-koa-connect
之前使用 express 作为 Node 服务端开发框架,整合 keycloak 非常方便,直接使用 keycloak-nodejs-connect 就行.  <br>
但是我们在开始新项目时,采用 koa 作为服务端开发框架,发现使用常规的将 express 的中间件转换成 koa 中间件的方法,并不适合 keycloak-nodejs-connect 这个库,所以我阅读了下 keycloak-nodejs-connect 的源码,fork 了一份,改成了使用于 koa 的中间件. <br>

因为中国大陆地区 keycloak 使用率不高,所以,估计该库除我现在所在的团队使用外,没有其他人会用 😅 <br>
虽然团队内部一直在用 keycloak ,但是一直都是我在整合与 keycloak 相关的功能,所以我并没有写 readme,为了方便其他可能会使用的人,我简单的补全下使用方法 <br>

## 安装
$ npm i keycloak-koa-connect --save

## 使用方法
因为该库是用 typescript 实现的,所以,如果在 nodejs 中直接导入(require)获取不到值,需要获取其 default 属性 <br>
nodejs
```
const KeycloakConnect = require('keycloak-koa-connect').default;
const bodyStore = require('keycloak-koa-connect/stores/body-store').default; // 如果使用该选项,在 body 中包含 jwt 的值,也是合法的
const queryStore = require('keycloak-koa-connect/stores/query-store').default; // 如果使用该选项,在http://a.com?jwt=token这样传递 token,也是合法的
const Koa = require('koa');
const Keycloak = require('keycloak.json'); // keycloak 配置文件

const app = new Koa();

const guard = new KeycloakConnect({ store: [queryStore, bodyStore] }, Keycloak);
guard.middleware()
  .map((item) => {
    app.use(item);
  });

app.listen(3000);

```

typescript
```
import KeycloakConnect from 'keycloak-koa-connect';
import bodyStore from 'keycloak-koa-connect/stores/body-store'; // 如果使用该选项,在 body 中包含 jwt 的值,也是合法的
import queryStore from 'keycloak-koa-connect/stores/query-store'; // 如果使用该选项,在http://a.com?jwt=token这样传递 token,也是合法的
import * as Koa from 'koa';
import Keycloak from 'keycloak.json'; // keycloak 配置文件

const app = new Koa();

const guard = new KeycloakConnect({store: [queryStore, bodyStore]}, Keycloak);
guard.middleware().map((item)=>{
  app.use(item);
});

app.listen(3000)

```

keycloak.json
```
{
  "realm": "", // realm
  "auth-server-url": "", // keycloak 的 URL,例: http://127.0.0.1:8080/auth
  "ssl-required": "external",
  "resource": "", // client ID
  "bearer-only": true, // 必填参数
  "credentials": {
    "secret": "如果启用了 client-secret ,那么这里需要填写 secret"
  },
  "use-resource-role-mappings": true,
  "confidential-port": 0,
  "realm-public-key": ""
}
```
