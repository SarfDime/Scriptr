import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { HonoEnv } from '../types/env.types'

export function requiredParam(c: Context<HonoEnv>, name: string): string {
  const value = c.req.param(name)
  if (!value) {
    throw new HTTPException(400, {
      message: `Missing route parameter: ${name}`,
    })
  }
  return value
}
