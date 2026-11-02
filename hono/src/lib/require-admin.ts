import { isAdmin } from '../../../shared/utils/api.utils'
import type { createSupabaseClient } from './supabase'

/**
 * Explicit admin check for a write route that is already gated by `is_admin()`
 * in RLS. The RLS check is the real boundary; this exists so the caller gets a
 * clean `403` instead of an RLS rejection mapped from a database error.
 *
 * Runs on the caller's own session client, so it reads the role through the
 * same policy the insert/update will.
 */
export async function requireAdmin(
  supabase: ReturnType<typeof createSupabaseClient>,
  userId: string
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return isAdmin(profile?.role)
}
