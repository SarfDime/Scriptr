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

export function requiredParam(c: Context<HonoEnv>, name: string): string {
  const value = c.req.param(name)
  if (!value) {
    throw new HTTPException(400, {
      message: `Missing route parameter: ${name}`,
    })
  }
  return value
}
