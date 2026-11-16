import { createClient } from '@supabase/supabase-js'
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import {
  isProfileSubjectStatus,
  isUserRole,
} from '../../../shared/utils/api.utils'
import type { AuthUser, HonoEnv } from '../types/env.types'
import type { Database } from '../types/supabase-override-types'
import { honoLog } from './logger'

/** Sessions are handled through HTTP-only cookies for security and persistence;
 * the endpoint and credentials come from the context's environment.
 */
export function createSupabaseClient(c: Context<HonoEnv>) {
  return createClient<Database>(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: false,
        storageKey: 'sb-auth-token',
        storage: createCookieStorage(c),
      },
    }
  )
}

/** Internal service-role client that bypasses row-level security for trusted server-side mutations. */
export function createInternalSupabaseClient(c: Context<HonoEnv>) {
  return createClient<Database>(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/** Proper cookie storage with full read/write support */
function createCookieStorage(c: Context<HonoEnv>) {
  const forwardedProto = c.req.header('x-forwarded-proto')
  const secure =
    c.env.NODE_ENV === 'production' ||
    c.req.url.startsWith('https://') ||
    forwardedProto?.split(',')[0]?.trim() === 'https'
  // Same-site via a shared parent domain (e.g. .scriptr.uk) lets Lax work; unset locally.
  const domain = process.env.COOKIE_DOMAIN || undefined

  return {
    getItem: (key: string) => getCookie(c, key) || null,
    setItem: (key: string, value: string) => {
      try {
        const session = JSON.parse(value)
        const expiresAt = session.expires_at
          ? parseInt(session.expires_at, 10)
          : undefined
        const maxAge = expiresAt
          ? Math.floor((expiresAt * 1000 - Date.now()) / 1000)
          : 3600

        setCookie(c, key, value, {
          path: '/',
          domain,
          httpOnly: true,
          secure,
          sameSite: 'Lax',
          maxAge,
        })
      } catch {
        setCookie(c, key, value, {
          path: '/',
          domain,
          httpOnly: true,
          secure,
          sameSite: 'Lax',
          maxAge: 3600,
        })
      }
    },
    removeItem: (key: string) => {
      deleteCookie(c, key, { path: '/', domain })
    },
  }
}

/** Authentication middleware that checks for a valid session (cookie) and attaches the user object to the context.
 * If the session is invalid or missing, it returns a 401 error.
 * If the user object is not found in the profiles table, it defaults to a student role with no subject statuses.
 */
export const authMiddleware = async (
  c: Context<HonoEnv>,
  next: () => Promise<void>
) => {
  try {
    const isScriptViewerRead =
      c.req.method === 'GET' &&
      (c.req.path.startsWith('/api/favorites/') ||
        c.req.path.endsWith('/my-vote'))
    if (isScriptViewerRead) {
      const sessionCookie = getCookie(c, 'sb-auth-token')
      let sessionExpiresAt: number | null = null
      if (sessionCookie) {
        try {
          const session: unknown = JSON.parse(sessionCookie)
          if (
            typeof session === 'object' &&
            session !== null &&
            'expires_at' in session
          ) {
            const expiresAt = session.expires_at
            if (typeof expiresAt === 'number' && Number.isFinite(expiresAt)) {
              sessionExpiresAt = expiresAt
            } else if (typeof expiresAt === 'string' && expiresAt.trim()) {
              const parsedExpiresAt = Number(expiresAt)
              if (Number.isFinite(parsedExpiresAt)) {
                sessionExpiresAt = parsedExpiresAt
              }
            }
          }
        } catch {
          // Keep malformed cookie details out of logs.
        }
      }
      const secondsUntilExpiry =
        sessionExpiresAt === null
          ? null
          : sessionExpiresAt - Math.floor(Date.now() / 1000)
      honoLog({
        logLevel: 'info',
        message: `Script viewer auth diagnostic: ${c.req.method} ${c.req.path} authCookiePresent=${sessionCookie !== undefined} sessionExpiresAt=${sessionExpiresAt ?? 'unknown'} secondsUntilExpiry=${secondsUntilExpiry ?? 'unknown'}`,
      })
    }

    const supabase = createSupabaseClient(c)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return c.json({ error: 'Not authenticated' }, 401)
    }

    // OPTIMIZATION: Fetch all related profile data in a single joined query
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        username, 
        role,
        profile_subjects (subject_id, status),
        profile_faculties (faculty_id),
        profile_studies (study_id)
      `)
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      honoLog({
        logLevel: 'error',
        message: 'Database error fetching profile',
        error: profileError,
      })
      return c.json(
        { error: 'Internal server error while fetching profile' },
        500
      )
    }

    const userProfile = {
      username: profile?.username ?? user?.email,
      role: isUserRole(profile?.role) ? profile?.role : 'student',
      subjects:
        profile?.profile_subjects?.flatMap(({ subject_id, status }) =>
          isProfileSubjectStatus(status) ? [{ subject_id, status }] : []
        ) ?? [],
      selected_faculty_ids:
        profile?.profile_faculties?.map(({ faculty_id }) => faculty_id) ?? [],
      selected_study_ids:
        profile?.profile_studies?.map(({ study_id }) => study_id) ?? [],
    }

    const authenticatedUser: AuthUser = {
      ...user,
      profile: userProfile,
    }

    c.set('user', authenticatedUser)

    await next()
    return
  } catch (error) {
    honoLog({ logLevel: 'error', message: 'Middleware crash', error })
    return c.json({ error: 'Internal server error' }, 500)
  }
}
