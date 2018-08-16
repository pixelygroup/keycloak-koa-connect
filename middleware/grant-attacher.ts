/**
 * Created by zhangsong on 2018/8/9.
 */
export default function(keycloak) {
  return async function grantAttacher(ctx, next) {
    ctx.state.kauth.grant = await keycloak.getGrant(ctx);
    await next();
  };
}
