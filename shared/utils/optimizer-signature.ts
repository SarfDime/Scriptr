const encoder = new TextEncoder()

export const OPTIMIZER_SIGNATURE_HEADER = 'x-optimizer-signature'
export const OPTIMIZER_TIMESTAMP_HEADER = 'x-optimizer-timestamp'
/** How far a request's timestamp may be from the verifier's clock, so a
 * captured request can't be replayed later. */
export const OPTIMIZER_MAX_CLOCK_SKEW_MS = 5 * 60 * 1000

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
 * HMAC-SHA256 over `${timestamp}.${body}`, as hex. The API signs the request
 * it sends to the optimizer service and the service verifies it, so the shared
 * secret never travels and a captured request expires. Web Crypto only, so it
 * runs in Node and on edge runtimes alike.
 */
export const signOptimizerRequest = async (
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

type VerifyOptimizerRequestInput = {
  secret: string
  timestamp: string
  signature: string
  body: string
  /** Clock override, for tests. */
  now?: number
}

/** Checks the signature (in constant time) and that the timestamp is fresh. */
export const verifyOptimizerRequest = async ({
  secret,
  timestamp,
  signature,
  body,
  now = Date.now(),
}: VerifyOptimizerRequestInput): Promise<boolean> => {
  const issuedAt = Number(timestamp)
  if (
    !Number.isFinite(issuedAt) ||
    Math.abs(now - issuedAt) > OPTIMIZER_MAX_CLOCK_SKEW_MS
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
