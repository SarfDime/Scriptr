import type { AppType } from '@scriptr/api'
import { hc } from 'hono/client'

export const api = hc<AppType>(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787',
)
