/** biome-ignore-all lint/style/useNamingConvention: <No need for now> */
import type { User } from '@supabase/supabase-js'
import type {
  ProfileSubjectStatus,
  UserRole,
} from '../../../shared/types/profile.types'

export type Env = {
  NODE_ENV?: 'development' | 'test' | 'production'
  CORS_ORIGINS?: string
  SUPABASE_URL: string
  SUPABASE_PUBLISHABLE_KEY: string
  SUPABASE_SECRET_KEY: string
  /** Scopes the sitemap's script list. Next holds the only copy. */
  SITEMAP_SECRET?: string
  /** Base32 TOTP secret the operator enrols in an authenticator app. Also
   * derives the signing key for the twenty-minute Studio token. */
  ADMIN_TOTP_SECRET?: string
  /** The only origin allowed to use `/api/sanity/*`, e.g.
   * `https://scriptr.sanity.studio`. Required in production. */
  SANITY_STUDIO_ORIGIN?: string
  /** The only origin allowed to use the website's admin surface, e.g.
   * `https://scriptr.uk`. Required in production. */
  WEBSITE_ORIGIN?: string
  R2_ACCOUNT_ID: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_ENDPOINT: string
  R2_BUCKET: string
  R2_PUBLIC_URL: string
  NEXT_REVALIDATE_URL?: string
  REVALIDATE_SECRET?: string
  /** The web project's Protection Bypass for Automation secret. Needed because
   * `NEXT_REVALIDATE_URL` is a Vercel deployment alias, which Vercel
   * Authentication answers `401` on before the route runs. */
  WEB_PROTECTION_BYPASS_SECRET?: string
  /** Base URL and shared secret of the file optimizer service. Both or neither:
   * with neither set, the in-process stand-in runs. */
  OPTIMIZER_URL?: string
  OPTIMIZER_SECRET?: string
}

export type AuthUser = User & {
  profile?: {
    username?: string
    role?: UserRole
    subjects?: Array<{ subject_id: string; status: ProfileSubjectStatus }>
    selected_faculty_ids?: Array<string>
    selected_study_ids?: Array<string>
  }
}

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
