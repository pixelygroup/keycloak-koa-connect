/**
 * Created by zhangsong on 2018/8/9.
 */

import BearerStore from './stores/bearer-store';
import CookieStore from './stores/cookie-store';
import SessionStore from './stores/session-store';

import Admin from './middleware/admin';
import Config from './middleware/auth-utils/config';
import GrantManager from './middleware/auth-utils/grant-manager';
import GrantAttacher from './middleware/grant-attacher';
import Logout from './middleware/logout';
import PostAuth from './middleware/post-auth';
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
    this.config = new Config(keycloakConfig);
    this.grantManager = new GrantManager(this.config);
    this.stores = [BearerStore];
    if (!config) {
      throw new Error('Adapter configuration must be provided.');
    }
    // Add the custom scope value
    this.config.scope = config.scope;

    if (config && config.store && config.cookies) {
      throw new Error('Either `store` or `cookies` may be set, but not both');
    }

    if (config && config.store) {
      this.stores.push(new SessionStore(config.store));
    } else if (config && config.cookies) {
      this.stores.push(CookieStore);
    }
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
    middlewares.push(PostAuth(this));
    middlewares.push(Admin(this, option.admin));
    middlewares.push(GrantAttacher(this));
    middlewares.push(Logout(this, option.logout));

    return middlewares;
  }

  /**
   * Apply protection middleware to an application or specific URL.
   *
   * If no `spec` parameter is provided, the subsequent handlers will
   * be invoked if the user is authenticated, regardless of what roles
   * he or she may or may not have.
   *
   * If a user is not currently authenticated, the middleware will cause
   * the authentication workflow to begin by redirecting the user to the
   * Keycloak installation to login.  Upon successful login, the user will
   * be redirected back to the originally-requested URL, fully-authenticated.
   *
   * If a `spec` is provided, the same flow as above will occur to ensure that
   * a user it authenticated.  Once authenticated, the spec will then be evaluated
   * to determine if the user may or may not access the following resource.
   *
   * The `spec` may be either a `String`, specifying a single required role,
   * or a function to make more fine-grained determination about access-control
   *
   * If the `spec` is a `String`, then the string will be interpreted as a
   * role-specification according to the following rules:
   *
   *  - If the string starts with `realm:`, the suffix is treated as the name
   *    of a realm-level role that is required for the user to have access.
   *  - If the string contains a colon, the portion before the colon is treated
   *    as the name of an application within the realm, and the portion after the
   *    colon is treated as a role within that application.  The user then must have
   *    the named role within the named application to proceed.
   *  - If the string contains no colon, the entire string is interpreted as
   *    as the name of a role within the current application (defined through
   *    the installed `keycloak.json` as provisioned within Keycloak) that the
   *    user must have in order to proceed.
   *
   * Example
   *
   *     // Users must have the `special-people` role within this application
   *     app.get( '/special/:page', keycloak.protect( 'special-people' ), mySpecialHandler );
   *
   * If the `spec` is a function, it may take up to two parameters in order to
   * assist it in making an authorization decision: the access token, and the
   * current HTTP request.  It should return `true` if access is allowed, otherwise
   * `false`.
   *
   * The `token` object has a method `hasRole(...)` which follows the same rules
   * as above for `String`-based specs.
   *     // Ensure that users have either `nicepants` realm-level role,
   *     or `mr-fancypants` app-level role.
   *     function pants(token, request) {
   *       return token.hasRole( 'realm:nicepants') || token.hasRole( 'mr-fancypants');
   *     }
   *
   *     app.get( '/fancy/:page', keycloak.protect( pants ), myPantsHandler );
   *
   * With no spec, simple authentication is all that is required:
   *
   *     app.get( '/complain', keycloak.protect(), complaintHandler );
   *
   * @param {String} spec The protection spec (optional)
   */
  public protect(spec) {
    return Protect(this, spec);
  }
  /**
   * Callback made upon successful authentication of a user.
   *
   * By default, this a no-op, but may assigned to another
   * function for application-specific login which may be useful
   * for linking authentication information from Keycloak to
   * application-maintained user information.
   *
   * The `request.kauth.grant` object contains the relevant tokens
   * which may be inspected.
   *
   * For instance, to obtain the unique subject ID:
   *
   *     request.kauth.grant.id_token.sub => bf2056df-3803-4e49-b3ba-ff2b07d86995
   *
   * @param {Object} request The HTTP request.
   */
  public authenticated(request) {
    // no-op
  }
  /**
   * Callback made upon successful de-authentication of a user.
   *
   * By default, this is a no-op, but may be used by the application
   * in the case it needs to remove information from the user's session
   * or otherwise perform additional logic once a user is logged out.
   *
   * @param {Object} request The HTTP request.
   */
  public eauthenticated(request) {
    // no-op
  }

  public accessDenied(request, response) {
    // TODO: 修改为koa调用的方式
    response.status(403);
    response.end('Access denied');
  }
  public getGrant(request, response) {
    let rawData;

    for (const item of this.stores) {
      rawData = item.get(request);
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
        .then((grant) => {
          self.storeGrant(grant, request, response);
          return grant;
        })
        .catch(() => {
          return Promise.reject();
        });
    }
    return Promise.reject();
  }

  public storeGrant(grant, request, response) {
    if (this.stores.length < 2 || BearerStore.get(request)) {
      // cannot store bearer-only, and should not store if grant is from the
      // authorization header
      return;
    }
    if (!grant) {
      this.accessDenied(request, response);
      return;
    }

    this.stores[1].wrap(grant);
    grant.store(request, response);
    return grant;
  }

  public unstoreGrant(sessionId) {
    if (this.stores.length < 2) {
      // cannot unstore, bearer-only, this is weird
      return;
    }

    this.stores[1].clear(sessionId);
  }

  public getGrantFromCode(code, request, response) {
    if (this.stores.length < 2) {
      // bearer-only, cannot do this;
      throw new Error('Cannot exchange code for grant in bearer-only mode');
    }

    const sessionId = request.session.id;

    const self = this;
    return this.grantManager.obtainFromCode(request, code, sessionId)
      .then((grant) => {
        self.storeGrant(grant, request, response);
        return grant;
      });
  }

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

  public redirectToLogin(request) {
    return !this.config.bearerOnly;
  }
}

export default Keycloak;
