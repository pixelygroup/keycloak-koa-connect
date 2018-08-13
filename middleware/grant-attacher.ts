/**
 * Created by zhangsong on 2018/8/9.
 */
export default function(keycloak) {
  return async function grantAttacher(ctx, next) {
    try {
      ctx.state.kauth.grant = await keycloak.getGrant(ctx);
      await next();
    } catch (e) {
      await next();
    }
  };
}
