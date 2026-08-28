/** biome-ignore-all lint/style/useNamingConvention: <No need for now> */
import type { User } from '@supabase/supabase-js'

// Define your environment variable types
export type Env = {
  SUPABASE_URL: string
  SUPABASE_PUBLISHABLE_KEY: string
  SUPABASE_SECRET_KEY: string
  R2_ACCOUNT_ID: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_ENDPOINT: string
  R2_BUCKET: string
  R2_PUBLIC_URL: string
}

// Extend User type with additional custom properties
export type AuthUser = User & {
  profile?: {
    username?: string
    role?: string
    completed_subject_ids?: Array<string>
  }
}

// Define Hono context with variables
export type HonoEnv = {
  Bindings: Env
  Variables: {
    user: AuthUser
  }
}

export type PresignedUrlResponse = {
  presignedUrl: string
  key: string
  expiresIn: number
}
