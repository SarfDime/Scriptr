import { createClient } from '@supabase/supabase-js'
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { HonoEnv } from '../types/env.types'
import type { Database } from '../types/supabase'

/** Creates a Supabase client with the given context, using environment variables for the endpoint and credentials.
 * Sessions are handled via HTTP-only cookies for security and persistence.
 */
export function createSupabaseClient(c: Context<HonoEnv>) {
  return createClient<Database>(c.env.SUPABASE_URL, c.env.SUPABASE_API_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'sb-auth-token',
      storage: createCookieStorage(c),
    },
  })
}

/** Proper cookie storage with full read/write support */
function createCookieStorage(c: Context<HonoEnv>) {
  return {
    getItem: (key: string) => {
      return getCookie(c, key) || null
    },
    setItem: (key: string, value: string) => {
      // Parse the session data to get expiration
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
          httpOnly: true,
          secure: false, // TODO: Set to true in production with HTTPS
          sameSite: 'Lax',
          maxAge,
        })
      } catch {
        // Fallback if parsing fails
        setCookie(c, key, value, {
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
          maxAge: 3600,
        })
      }
    },
    removeItem: (key: string) => {
      deleteCookie(c, key, { path: '/' })
    },
  }
}

/** Authentication middleware that checks for a valid session (cookie) and attaches the user object to the context.
 * If the session is invalid or missing, it returns a 401 error.
 * If the user object is not found in the profiles table, it defaults to a student role with no subjects passed.
 */
export const authMiddleware = async (
  c: Context<HonoEnv>,
  next: () => Promise<void>
) => {
  try {
    // Create client - it will automatically read cookies
    const supabase = createSupabaseClient(c)

    // Get the current user from the session (cookies)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return c.json({ error: 'Not authenticated' }, 401)
    }

    // Get additional profile info
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, role, subjects_passed')
      .eq('id', user.id)
      .single()

    const userProfile = {
      username: profile?.username ?? user?.email,
      role: profile?.role ?? 'student',
      subjects_passed: profile?.subjects_passed ?? [],
    }

    // Attach user to context
    c.set('user', {
      ...user,
      profile: userProfile,
    })

    await next()
  } catch (error) {
    return c.json({ error: `Authentication failed: ${error}` }, 401)
  }
}
