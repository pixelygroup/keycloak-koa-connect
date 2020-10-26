# keycloak-koa-connect
This is a fork of https://github.com/xrian/keycloak-koa-connect

## Introduction
It is very convenient to integrate keycloak with express js by keycloak-nodejs-connect directly. <br>
However, when we started a new project, we adopted koa as the server-side development framework and found that the conventional method of converting express middleware to koa middleware was not suitable for the keycloak-nodejs-connect library.
<br><br>
We will try to extend this documentation with every release. And cover some scenarios not mentioned in the original project.

## Installation
```
$ npm i @pixelygroup/keycloak-koa-connect --save
```

## Instructions
Because the library is implemented with Typescript, if you directly import (require) in nodejs using ES syntax, you will get no value, thus you need to import it's .default attribute

In root folder create a `keycloak.js` file with your configuration and `init-keycloak.js`.
### keycloak.js
```
// keycloak.js

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

### init-keycloak.js
```
// init-keycloak.js

const KeycloakConnect = require('@pixelygroup/keycloak-koa-connect').default
const bodyStore = require('@pixelygroup/keycloak-koa-connect/stores/body-store').default // If this option is used, it is legal to include the value of jwt in the body
const queryStore = require('@pixelygroup/keycloak-koa-connect/stores/query-store').default // If this option is used, it is also legal to pass a token at http://a.com?jwt=token

const Keycloak = require('./keycloak.js')
const keycloak = new KeycloakConnect({ store: [queryStore, bodyStore,]}, Keycloak)

module.exports = { keycloak }
```

Then in:

### nodejs
```
// index.js

const Koa = require('koa');
const app = new Koa();

const { keycloak } = require('./init-keycloak.js')

keycloak.middleware()
  .map(item => {
    app.use(item)
})

app.listen(3000);

```

### typescript
```
// index.ts
import * as Koa from 'koa';
const app = new Koa();

const { keycloak } = require('./init-keycloak.js')

keycloak.middleware()
  .map(item => {
    app.use(item)
})

app.listen(3000)

```

## Notes
If you define your routes in `routes/index.js`, you need to import `init-keycloack.js` there as well

### nodejs
```
// routes/index.js

const Router = require('koa-router')
const router = new Router()

const { keycloak } = require('../init-keycloak.js')

// ## To secure a resource with an application role for the current app:
router.get( '/special', keycloak.protect('special'), specialHandler )

// ## To secure a resource with an application role for a different app:
router.get( '/extra-special', keycloak.protect('other-app:special'), extraSpecialHandler )

// ## To secure a resource with a realm role:
router.get( '/admin', keycloak.protect( 'realm:admin' ), adminHandler )

```

## Do you enjoy this package? Help us keep it maintained!
### [Buy us a coffee or become a sponsor](https://github.com/sponsors/pixelygroup)