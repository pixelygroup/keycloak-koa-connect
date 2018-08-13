/**
 * Created by zhangsong on 2018/8/9.
 */
export default async function setup(ctx, next) {
  ctx.state.kauth = {};
  await next();
}
