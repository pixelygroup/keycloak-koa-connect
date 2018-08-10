/**
 * Created by zhangsong on 2018/8/9.
 */

const store = (grant) => {
  return (ctx) => {
    ctx.request.session[SessionStore.TOKEN_KEY] = grant.__raw;
  };
};
const unStore = (ctx) => {
  delete ctx.request.session[SessionStore.TOKEN_KEY];
};

class SessionStore {
  public static TOKEN_KEY = 'keycloak-token';

  public store;
  constructor(st) {
    this.store = st;
  }

  public get(ctx) {
    return ctx.request.session[SessionStore.TOKEN_KEY];
  }

  public clear(sessionId) {
    const self = this;
    this.store.get(sessionId, (err, session) => {
      if (err) {
        console.error(err);
      }
      if (session) {
        delete session[SessionStore.TOKEN_KEY];
        self.store.set(sessionId, session);
      }
    });
  }

  public wrap(grant) {
    if (grant) {
      grant.store = store(grant);
      grant.unstore = unStore;
    }
  }
}

export default SessionStore;
