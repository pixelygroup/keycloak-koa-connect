/**
 * Created by zhangsong on 2018/8/9.
 */

export default function(keycloak, logoutUrl) {
  return async function logout(ctx, next) {
    if (ctx.request.url !== logoutUrl) {
      return await next();
    }

    if (ctx.state.kauth.grant) {
      keycloak.deauthenticated(ctx);
      ctx.state.kauth.grant.unstore(ctx);
      delete ctx.state.kauth.grant;
    }

    const host = ctx.request.hostname;
    const headerHost = ctx.request.host.split(':');
    const port = headerHost[1] || '';
    const redirectUrl = ctx.request.protocol + '://' + host + (port === '' ? '' : ':' + port) + '/';
    const keycloakLogoutUrl = keycloak.logoutUrl(redirectUrl);

    ctx.response.redirect(keycloakLogoutUrl);
  };
}
