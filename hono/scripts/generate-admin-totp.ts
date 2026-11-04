/** biome-ignore-all lint/suspicious/noConsole: <This script exists to print a secret for the operator> */
import { generateTotpSecret, totpUri } from '../src/lib/admin-access'

/** Prints a fresh TOTP secret and the URI an authenticator app enrols from.
 * The secret is printed once and never stored: paste it into `hono/.env` as
 * `ADMIN_TOTP_SECRET`, then scan or type the URI into the app. */
const secret = generateTotpSecret()

console.log(`ADMIN_TOTP_SECRET=${secret}`)
console.log(`otpauth URI: ${totpUri({ secret, account: 'sanity-studio' })}`)
console.log(
  'Add the URI to an authenticator app (most apps accept it as a QR payload or a manual entry), then restart the API.'
)
