const encoder = new TextEncoder()

/** How far a request's timestamp may be from the verifier's clock, so a
 * captured request can't be replayed later. */
export const REQUEST_MAX_CLOCK_SKEW_MS = 5 * 60 * 1000

const importKey = (secret: string, usage: 'sign' | 'verify') =>
  crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  )

const signedPayload = (timestamp: string, body: string) =>
  encoder.encode(`${timestamp}.${body}`)

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('')

const fromHex = (hex: string): Uint8Array<ArrayBuffer> | null =>
  /^([0-9a-f]{2})+$/.test(hex)
    ? Uint8Array.from(hex.match(/../g) ?? [], (pair) =>
        Number.parseInt(pair, 16)
      )
    : null

/**
 * HMAC-SHA256 over `${timestamp}.${body}`, as hex, shared by every signed
 * server-to-server call (the optimizer service and the web app's revalidate
 * route). The shared secret never travels, and a captured request expires
 * instead of being replayable forever. Web Crypto only, so it runs in Node and
 * on edge runtimes alike.
 */
export const signRequest = async (
  secret: string,
  timestamp: string,
  body: string
): Promise<string> =>
  toHex(
    await crypto.subtle.sign(
      'HMAC',
      await importKey(secret, 'sign'),
      signedPayload(timestamp, body)
    )
  )

type VerifyRequestInput = {
  secret: string
  timestamp: string
  signature: string
  body: string
  /** Clock override, for tests. */
  now?: number
}

/** Checks the signature (in constant time) and that the timestamp is fresh. */
export const verifyRequest = async ({
  secret,
  timestamp,
  signature,
  body,
  now = Date.now(),
}: VerifyRequestInput): Promise<boolean> => {
  const issuedAt = Number(timestamp)
  if (
    !Number.isFinite(issuedAt) ||
    Math.abs(now - issuedAt) > REQUEST_MAX_CLOCK_SKEW_MS
  ) {
    return false
  }

  const signatureBytes = fromHex(signature)
  if (!signatureBytes) return false

  return crypto.subtle.verify(
    'HMAC',
    await importKey(secret, 'verify'),
    signatureBytes,
    signedPayload(timestamp, body)
  )
}

/**
 * Compares a presented header value to an expected secret without an early
 * exit. Web Crypto has no string comparison, so both values are hashed to a
 * fixed width first: the comparison then runs over the same number of bytes
 * whatever the input length. Used by callers that receive a plain shared secret
 * rather than an HMAC — a Sanity webhook, for instance, can only send a header.
 */
export const matchesSecret = async (
  provided: string | null,
  secret: string
): Promise<boolean> => {
  if (!provided) return false

  const encoder = new TextEncoder()
  const [providedDigest, secretDigest] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(secret)),
  ])
  const left = new Uint8Array(providedDigest)
  const right = new Uint8Array(secretDigest)

  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= (left.at(index) ?? 0) ^ (right.at(index) ?? 0)
  }

  return difference === 0
}
