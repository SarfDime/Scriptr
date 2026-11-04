import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { HonoEnv } from '../types/env.types'
import { honoLog } from './logger'

export function databaseErrorResponse(
  c: Context<HonoEnv>,
  error: { code?: string; message: string }
) {
  honoLog({
    logLevel: 'error',
    message: `Database request failed: ${c.req.method} ${c.req.path}`,
    error,
  })
  return c.json({ error: 'Unable to complete the request' }, 500)
}

/** Largest body an unauthenticated route will accept. The access-code routes
 * are the only places this matters: they read JSON before anything is verified,
 * so a megabyte of junk would otherwise be buffered per request. */
export const MAX_JSON_BODY_BYTES = 4 * 1024

/** True when the request declares (or actually carries) more than `maxBytes`
 * worth of body. Checked before parsing, because a `content-length` header can
 * lie. */
export async function exceedsBodyLimit(
  c: Context<HonoEnv>,
  maxBytes: number
): Promise<boolean> {
  const declared = Number(c.req.header('content-length') ?? Number.NaN)
  if (Number.isFinite(declared) && declared > maxBytes) return true

  const body = await c.req.text()
  return body.length > maxBytes
}

export async function readJsonBody(
  c: Context<HonoEnv>
): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await c.req.json()
    return body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

/** The caller's IP, as the platform reports it. Used for rate-limit keys that
 * must hold across a deployment, so it is deliberately not a per-route value. */
export function clientIp(c: Context<HonoEnv>): string {
  return (
    c.req.header('cf-connecting-ip') ??
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    'unknown-ip'
  )
}

export function requiredParam(c: Context<HonoEnv>, name: string): string {
  const value = c.req.param(name)
  if (!value) {
    throw new HTTPException(400, {
      message: `Missing route parameter: ${name}`,
    })
  }
  return value
}
