import type { ProfileScriptSummary } from '@shared/types/profile.types'
import type { ScriptDetail } from '@/types/components/Scripts.types'

/**
 * Turns a profile's embedded scripts (PROFILE_SCRIPT_FIELDS in
 * hono/src/routes/profiles.ts) into the shape ScriptsSection/ScriptCard
 * expect. Used for both a profile's authored scripts and its favorited
 * scripts — author comes from each script's own embedded `author`, not a
 * name passed in by the caller: for a favorited-scripts list, the actual
 * author is whoever wrote that script, not the profile being viewed (an
 * earlier version of this function took an `authorDisplayName` param,
 * which was correct for authored scripts but would have mislabeled every
 * favorited script as written by the profile owner).
 *
 * `likes` stands in for `vote_score` — the schema has no separate "likes"
 * concept for scripts, only the up/down vote score (see ARCHITECTURE.md
 * on votes vs. comment-level likes). ScriptLikeButton's own wiring is
 * unrelated to this change and untouched; flagging this mapping so it's
 * an intentional, visible choice rather than a silent one.
 *
 * `professor` and `year` are left undefined — see PROFILE_SCRIPT_FIELDS'
 * comment for why neither is obtainable via a simple join today. Both are
 * optional on ScriptDetail, and every other script-list endpoint in this
 * app already omits them for the same reason.
 */
export const toScriptDetail = (script: ProfileScriptSummary): ScriptDetail => ({
  id: script.id,
  title: script.title,
  subject: script.subject?.name ?? '',
  author: script.author?.full_name || script.author?.username || '',
  updatedAt: new Date(script.updated_at),
  likes: script.vote_score,
  comments: script.comments[0]?.count ?? 0,
  files: script.files,
})

export const toScriptDetails = (
  scripts: Array<ProfileScriptSummary>
): Array<ScriptDetail> => scripts.map(toScriptDetail)
