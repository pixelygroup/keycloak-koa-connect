/**
 * Created by zhangsong on 2018/8/9.
 */

import Grant from './middleware/auth-utils/grant.js';
import BearerStore from './stores/bearer-store';
// import CookieStore from './stores/cookie-store';
// import SessionStore from './stores/session-store';

import Admin from './middleware/admin';
import Config from './middleware/auth-utils/config';
import GrantManager from './middleware/auth-utils/grant-manager';
import GrantAttacher from './middleware/grant-attacher';
import Logout from './middleware/logout';
// import PostAuth from './middleware/post-auth';
import Protect from './middleware/protect';
import Setup from './middleware/setup';

import IConfig from './interface/iconfig';

/**
 * Instantiate a Keycloak.
 *
 * The `config` and `keycloakConfig` hashes are both optional.
 *
 * The `config` hash, if provided, may include either `store`, pointing
 * to the actual session-store used by your application, or `cookies`
 * with boolean `true` as the value to support using cookies as your
 * authentication store.
 *
 * A session-based store is recommended, as it allows more assured control
 * from the Keycloak console to explicitly logout some or all sessions.
 *
 * In all cases, also, authentication through a Bearer authentication
 * header is supported for non-interactive APIs.
 *
 * The `keycloakConfig` object, by default, is populated by the contents of
 * a `keycloak.json` file installed alongside your application, copied from
 * the Keycloak administration console when you provision your application.
 *
 * @constructor
 *
 * @param      {Object}    config          Configuration for the Keycloak connector.
 * @param      {Object}    keycloakConfig  Keycloak-specific configuration.
 *
 * @return     {Keycloak}  A constructed Keycloak object.
 *
 */
class Keycloak {
  public config;
  public grantManager;
  public stores;

  // If keycloakConfig is null, Config() will search for `keycloak.json`.
  constructor(config?: IConfig, keycloakConfig?: string | object) {
    this.config = new Config(keycloakConfig); // 读取配置文件
    this.grantManager = new GrantManager(this.config); // 设置
    this.stores = [BearerStore];
    if (!config) {
      throw new Error('Adapter configuration must be provided.');
    }
    // Add the custom scope value
    this.config.scope = config.scope;

    if (config && config.store && config.cookies) {
      throw new Error('Either `store` or `cookies` may be set, but not both');
    }

    // if (config && config.store) {
    //   this.stores.push(new SessionStore(config.store));
    // } else if (config && config.cookies) {
    //   this.stores.push(CookieStore);
    // }
  }

  /**
   * Obtain an array of middleware for use in your application.
   *
   * Generally this should be installed at the root of your application,
   * as it provides general wiring for Keycloak interaction, without actually
   * causing Keycloak to get involved with any particular URL until asked
   * by using `protect(...)`.
   *
   * Example:
   *
   *     var app = express();
   *     var keycloak = new Keycloak();
   *     app.use( keycloak.middleware() );
   *
   * Options:
   *
   *  - `logout` URL for logging a user out. Defaults to `/logout`.
   *  - `admin` Root URL for Keycloak admin callbacks.  Defaults to `/`.
   *
   * @param {Object} options Optional options for specifying details.
   */
  public middleware(options) {
    let option = { logout: '', admin: '' };
    if (options) {
      option = options;
    }
    option.logout = option.logout || '/logout';
    option.admin = option.admin || '/';

    const middlewares = [];

    middlewares.push(Setup);
    // middlewares.push(PostAuth(this));
    middlewares.push(Admin(this, option.admin));
    middlewares.push(GrantAttacher(this));
    middlewares.push(Logout(this, option.logout));

    return middlewares;
  }

  public protect(spec) {
    return Protect(this, spec);
  }

  public authenticated(ctx) {
    // no-op
  }

  public eauthenticated(ctx) {
    // no-op
  }

  public accessDenied(ctx) {
    ctx.throw(403, 'Access denied');
  }
  public getGrant(ctx) {
    let rawData;

    for (const item of this.stores) {
      rawData = item.get(ctx);
      if (rawData) {
        // store = this.stores[i];
        break;
      }
    }

    let grantData = rawData;
    if (typeof (grantData) === 'string') {
      grantData = JSON.parse(grantData);
    }

    if (grantData && !grantData.error) {
      const self = this;
      return this.grantManager.createGrant(JSON.stringify(grantData))
        .then((grant: Grant) => {
          self.storeGrant(grant, ctx);
          return grant;
        })
        .catch(() => {
          return Promise.reject();
        });
    }
    return Promise.reject();
  }

  public storeGrant(grant, ctx) {
    if (this.stores.length < 2 || BearerStore.get(ctx)) {
      // cannot store bearer-only, and should not store if grant is from the
      // authorization header
      return;
    }
    if (!grant) {
      this.accessDenied(ctx);
      return;
    }

    this.stores[1].wrap(grant);
    grant.store(ctx);
    return grant;
  }

  public unstoreGrant(sessionId) {
    if (this.stores.length < 2) {
      // cannot unstore, bearer-only, this is weird
      return;
    }

    this.stores[1].clear(sessionId);
  }

  public getGrantFromCode(code, ctx) {
    if (this.stores.length < 2) {
      // bearer-only, cannot do this;
      throw new Error('Cannot exchange code for grant in bearer-only mode');
    }

    const sessionId = ctx.session.id;

    const self = this;
    return this.grantManager.obtainFromCode(ctx, code, sessionId)
      .then((grant) => {
        self.storeGrant(grant, ctx);
        return grant;
      });
  }

  // 组成登录的 URL 重定向过去
  public loginUrl(uuid, redirectUrl) {
    return this.config.realmUrl +
      '/protocol/openid-connect/auth' +
      '?client_id=' + encodeURIComponent(this.config.clientId) +
      '&state=' + encodeURIComponent(uuid) +
      '&redirect_uri=' + encodeURIComponent(redirectUrl) +
      '&scope=' + encodeURIComponent(this.config.scope ? 'openid ' + this.config.scope : 'openid') +
      '&response_type=code';
  }

  public logoutUrl(redirectUrl) {
    return this.config.realmUrl +
      '/protocol/openid-connect/logout' +
      '?redirect_uri=' + encodeURIComponent(redirectUrl);
  }

  public accountUrl() {
    return this.config.realmUrl + '/account';
  }
  public getAccount(token) {
    return this.grantManager.getAccount(token);
  }

  public redirectToLogin(ctx) {
    return !this.config.bearerOnly;
  }
}

export default Keycloak;
