/**
 * Created by zhangsong on 2018/8/9.
 */

import Token from './token';

/**
 * Construct a new grant.
 *
 * The passed in argument may be another `Grant`, or any object with
 * at least `access_token`, and optionally `refresh_token` and `id_token`,
 * `token_type`, and `expires_in`.  Each token should be an instance of
 * `Token` if present.
 *
 * If the passed in object contains a field named `__raw` that is also stashed
 * away as the verbatim raw `String` data of the grant.
 *
 * @param {Object} grant The `Grant` to copy, or a simple `Object` with similar fields.
 *
 * @constructor
 */
class Grant {
  public accessToken: Token;
  public refreshToken: Token;
  public idToken: Token;
  public tokenType;
  public expiresIn;
  public _raw;

  constructor(grant) {
    this.update(grant);
  }
  /**
   * Update this grant in-place given data in another grant.
   *
   * This is used to avoid making client perform extra-bookkeeping
   * to maintain the up-to-date/refreshed grant-set.
   */
  public update(grant) {
    // intentional naming with under_scores instead of
    // CamelCase to match both Keycloak's grant JSON
    // and to allow new Grant(new Grant(kc)) copy-ctor
    this.accessToken = grant.access_token;
    this.refreshToken = grant.refresh_token;
    this.idToken = grant.id_token;

    this.tokenType = grant.token_type;
    this.expiresIn = grant.expires_in;
    this._raw = grant.__raw;
  }

  /**
   * Returns the raw String of the grant, if available.
   *
   * If the raw string is unavailable (due to programatic construction)
   * then `undefined` is returned.
   */
  public toString() {
    return this._raw;
  }

  /**
   * Determine if this grant is expired/out-of-date.
   *
   * Determination is made based upon the expiration status of the `access_token`.
   *
   * An expired grant *may* be possible to refresh, if a valid
   * `refresh_token` is available.
   *
   * @return {boolean} `true` if expired, otherwise `false`.
   */
  public isExpired() {
    if (!this.accessToken) {
      return true;
    }
    return this.accessToken.isExpired();
  }

}

export default Grant;
