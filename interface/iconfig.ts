/**
 *
 * Created by zhangsong on 2018/8/10.
 */
import SessionStore from '../stores/session-store';

interface IConfig {
  scope?: string;
  store?: SessionStore;
  cookies?: string;
}

export default IConfig;
