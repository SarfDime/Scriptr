import type { ScriptFile, ScriptSummary } from '@shared/types/scripts.types'

/** Everything the script detail screen renders, resolved server-side so the
 * components only ever receive plain data (no fetching, no cookies). */
export type ScriptDetailViewModel = {
  scriptId: string
  script: ScriptSummary
  /** Already ordered by `position`. */
  files: Array<ScriptFile>
  voteScore: number
  hasVoted: boolean
  isAuthor: boolean
  /** The viewer may edit/delete the script and remove its files: its author
   * or an admin. Mirrors the API's check; the API stays the real boundary. */
  canManage: boolean
  isSaved: boolean
  /** A viewer-specific lookup (vote, favorite, session) failed: vote and save
   * are disabled and a toast is shown. */
  viewerDataFailed: boolean
  /** `null` renders the subject as plain text. */
  subjectHref: string | null
}
