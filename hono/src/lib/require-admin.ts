import { isOwner } from '../../../shared/utils/api.utils'
import type { createSupabaseClient } from './supabase'

/**
 * Explicit owner check for a write route that is already gated by `is_owner()`
 * in RLS. The RLS check is the real boundary; this exists so the caller gets a
 * clean `403` instead of an RLS rejection mapped from a database error.
 *
 * Runs on the caller's own session client, so it reads the role through the
 * same policy the insert/update will.
 */
export async function requireOwner(
  supabase: ReturnType<typeof createSupabaseClient>,
  userId: string
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return isOwner(profile?.role)
}

/**
 * Whether the caller may act on one study: an owner on any, a study admin or
 * moderator on theirs. Mirrors the RLS predicates, so a route that passes this
 * does not then fail on a policy.
 */
export async function requireStudyRole(
  supabase: ReturnType<typeof createSupabaseClient>,
  userId: string,
  studyId: string | null,
  need: 'admin' | 'moderator' = 'admin'
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (isOwner(profile?.role)) return true
  // A row with no study (a comment on a professor, a flag on a user) is
  // owner-only, the same rule the policies apply.
  if (!studyId) return false

  const { data: role } = await supabase
    .from('study_roles')
    .select('role')
    .eq('profile_id', userId)
    .eq('study_id', studyId)
    .maybeSingle()

  if (!role) return false
  return need === 'moderator'
    ? role.role === 'admin' || role.role === 'moderator'
    : role.role === 'admin'
}

/** The study a script belongs to, or null when it is missing or unknown. */
export async function studyIdForScript(
  supabase: ReturnType<typeof createSupabaseClient>,
  scriptId: string | null
): Promise<string | null> {
  if (!scriptId) return null

  const { data } = await supabase
    .from('scripts')
    .select('study_id')
    .eq('id', scriptId)
    .maybeSingle()

  return data?.study_id ?? null
}

/** The study a flag points at. Null for a flag on a user or a professor, which
 * only an owner handles. */
export async function studyIdForFlag(
  supabase: ReturnType<typeof createSupabaseClient>,
  flag: { target_script_id: string | null; target_comment_id: string | null }
): Promise<string | null> {
  if (flag.target_script_id) {
    return studyIdForScript(supabase, flag.target_script_id)
  }

  if (!flag.target_comment_id) return null

  const { data } = await supabase
    .from('comments')
    .select('script_id')
    .eq('id', flag.target_comment_id)
    .maybeSingle()

  return studyIdForScript(supabase, data?.script_id ?? null)
}

/**
 * Whether the caller holds any study role. The moderation queues use this
 * instead of a per-study check: RLS already limits which rows they can read, so
 * the route only needs to know that the caller is not an ordinary student.
 */
export async function hasAnyStudyRole(
  supabase: ReturnType<typeof createSupabaseClient>,
  userId: string
) {
  const { data } = await supabase
    .from('study_roles')
    .select('study_id')
    .eq('profile_id', userId)
    .limit(1)

  return (data?.length ?? 0) > 0
}
