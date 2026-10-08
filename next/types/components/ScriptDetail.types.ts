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
  isSaved: boolean
  /** `null` renders the subject as plain text. */
  subjectHref: string | null
}
