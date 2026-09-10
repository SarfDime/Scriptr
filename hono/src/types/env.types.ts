/** biome-ignore-all lint/style/useNamingConvention: <No need for now> */
import type { User } from '@supabase/supabase-js'
import type {
  ProfileSubjectStatus,
  UserRole,
} from '../../../shared/types/api.types'

// Define your environment variable types
export type Env = {
  NODE_ENV?: 'development' | 'test' | 'production'
  SUPABASE_URL: string
  SUPABASE_PUBLISHABLE_KEY: string
  SUPABASE_SECRET_KEY: string
  INTERNAL_API_SECRET?: string
  R2_ACCOUNT_ID: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_ENDPOINT: string
  R2_BUCKET: string
  R2_PUBLIC_URL: string
  NEXT_REVALIDATE_URL?: string
  REVALIDATE_SECRET?: string
}

// Extend User type with additional custom properties
export type AuthUser = User & {
  profile?: {
    username?: string
    role?: UserRole
    subjects?: Array<{ subject_id: string; status: ProfileSubjectStatus }>
    selected_faculty_ids?: Array<string>
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
