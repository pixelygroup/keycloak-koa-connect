# keycloak-koa-connect
之前使用 express 作为 Node 服务端开发框架,整合 keycloak 非常方便,直接使用 keycloak-nodejs-connect 就行. 
但是我们在开始新项目时,采用 koa 作为服务端开发框架,发现使用常规的将 express 的中间件转换成 koa 中间件的方法,并不适合 keycloak-nodejs-connect 这个库,所以我阅读了下 keycloak-nodejs-connect 的源码,fork 了一份,改成了使用于 koa 的中间件.

虽然团队内部一直在用 keycloak ,但是一直都是我在整合与 keycloak 相关的功能,所以我并没有写 readme,为了方便其他可能会使用的人,我简单的补全下使用方法

## 安装
$ npm i keycloak-koa-connect --save

## 使用方法
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

