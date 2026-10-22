import type { createSupabaseClient } from './supabase'

type UsernameLookup =
  | { ok: true; taken: boolean }
  | { ok: false; error: { code?: string; message: string } }

/**
 * Whether another profile already has `username` — the pre-check register
 * and profile edits share (`profiles` is publicly readable, so the plain
 * session client works for anonymous registration too). `excludeProfileId`
 * is the profile being edited, so keeping your own username isn't a
 * conflict. This is an exact match, the same as the `profiles_username_key`
 * unique index; the index (`23505`) remains the backstop for two writes
 * racing past this check.
 */
export async function isUsernameTaken(
  supabase: ReturnType<typeof createSupabaseClient>,
  username: string,
  excludeProfileId?: string
): Promise<UsernameLookup> {
  let query = supabase.from('profiles').select('id').eq('username', username)
  if (excludeProfileId) query = query.neq('id', excludeProfileId)

  const { data, error } = await query.maybeSingle()
  if (error) return { ok: false, error }
  return { ok: true, taken: data !== null }
}
