/** Wire contract for the TOTP access exchange, shared by the API, the Studio
 * and (later) the website's admin surface. Nothing here is secret: the code is
 * typed by the operator and the token is issued per request. */

/** `POST` body for the access-code exchange. */
export type AccessCodeRequest = { code: string }

/** A short-lived token, as returned by the exchange and cached by the caller. */
export type AccessToken = {
  token: string
  /** Epoch milliseconds. */
  expiresAt: number
}

export type AccessTokenResponse = AccessToken
