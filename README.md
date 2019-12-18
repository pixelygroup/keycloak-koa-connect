# keycloak-koa-connect
This is a fork of https://github.com/xrian/keycloak-koa-connect

## Introduction
It is very convenient to integrate keycloak with express js by keycloak-nodejs-connect directly. <br>
However, when we started a new project, we adopted koa as the server-side development framework and found that the conventional method of converting express middleware to koa middleware was not suitable for the keycloak-nodejs-connect library.

## Installation
```
$ npm i @pixelygroup/keycloak-koa-connect --save
```

## Instructions
Because the library is implemented with Typescript, if you directly import (require) in nodejs using ES syntax, you will get no value, thus you need to import it's .default attribute

nodejs

```
const KeycloakConnect = require('keycloak-koa-connect').default;
const bodyStore = require('keycloak-koa-connect/stores/body-store').default; // If this option is used, it is legal to include the value of jwt in the body
const queryStore = require('keycloak-koa-connect/stores/query-store').default; // If this option is used, it is also legal to pass a token at http://a.com?jwt=token
const Koa = require('koa');
const Keycloak = require('keycloak.js'); // keycloak 配置文件

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
import bodyStore from 'keycloak-koa-connect/stores/body-store'; // If this option is used, it is legal to include the value of jwt in the body
import queryStore from 'keycloak-koa-connect/stores/query-store'; // If this option is used, it is also legal to pass a token at http://a.com?jwt=token
import * as Koa from 'koa';
import Keycloak from 'keycloak.js'; // keycloak

const app = new Koa();

const guard = new KeycloakConnect({store: [queryStore, bodyStore]}, Keycloak);
guard.middleware().map((item)=>{
  app.use(item);
});

app.listen(3000)

```

keycloak.js
```
module.exports = {
  'realm': '', // realm
  'auth-server-url': '', // keycloak URL: http://127.0.0.1:8080/auth
  'ssl-required': 'external',
  'resource': '', // client ID
  'bearer-only': true,
  'credentials': {
    'secret': 'if-enabled client-secret ,then-need-to-fill-in-here secret'
  },
  'use-resource-role-mappings': true,
  'confidential-port': 0,
  'realm-public-key': ''
}
```
