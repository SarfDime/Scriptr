import { STUDY_JOIN_REQUIRED_CODE } from '../../../shared/config/api'
import { isOwner } from '../../../shared/utils/api.utils'
import type { createSupabaseClient } from './supabase'

/** The `403` body every study-scoped write returns, so a student who has not
 * joined the study gets one message wherever they hit the wall. The `code` is
 * what the client reads to offer setup instead of the restriction notice. */
export const STUDY_WRITE_DENIED_BODY = {
  error: 'Join this study before contributing to it',
  code: STUDY_JOIN_REQUIRED_CODE,
} as const

/**
 * Whether the caller may write inside one study. Writing means creating content
 * or interacting with it — a script, a comment, a vote, a rating, a favorite —
 * and needs either a relationship to the study (`profile_studies`, which setup
 * writes) or a role on it (admin and moderator), or an owner.
 *
 * Reads stay open: the catalog and every study's pages are readable by anyone,
 * and this is the counterpart that keeps writes where the reader belongs.
 *
 * A `null` study means the target is not study-scoped (a professor's comment, a
 * professor's rating). Those keep their older rule — any signed-in, unrestricted
 * account — so this answers `true` for an owner and `false` otherwise, and
 * callers that do not need a study simply do not ask.
 */
export async function canWriteInStudy(
  supabase: ReturnType<typeof createSupabaseClient>,
  userId: string,
  studyId: string | null
): Promise<boolean> {
  if (!studyId) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (isOwner(profile?.role)) return true

  const [{ data: role }, { data: membership }] = await Promise.all([
    supabase
      .from('study_roles')
      .select('role')
      .eq('profile_id', userId)
      .eq('study_id', studyId)
      .maybeSingle(),
    supabase
      .from('profile_studies')
      .select('study_id')
      .eq('profile_id', userId)
      .eq('study_id', studyId)
      .maybeSingle(),
  ])

  return Boolean(role ?? membership)
}

/** The study a subject belongs to, or null when the subject is unknown. */
export async function studyIdForSubject(
  supabase: ReturnType<typeof createSupabaseClient>,
  subjectId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('subjects')
    .select('study_id')
    .eq('id', subjectId)
    .maybeSingle()

  return data?.study_id ?? null
}

/** Whether a study id names a real study, so a caller's scope is rejected as a
 * `400` instead of surfacing as a foreign-key error. */
export async function studyExists(
  supabase: ReturnType<typeof createSupabaseClient>,
  studyId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('studies')
    .select('id')
    .eq('id', studyId)
    .maybeSingle()

  return Boolean(data)
}
