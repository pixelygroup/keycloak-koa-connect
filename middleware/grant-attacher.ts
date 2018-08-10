/**
 * Created by zhangsong on 2018/8/9.
 */
export default function(keycloak) {
  return function grantAttacher(ctx, next) {
    keycloak.getGrant(ctx)
      .then((grant) => {
        ctx.state.kauth.grant = grant;
      })
      .then(next)
      .catch(() => next());
  };
}
