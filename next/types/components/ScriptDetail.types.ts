import type { PortableTextValue } from '@shared/types/portable-text.types'
import type {
  LocalizedScriptText,
  ScriptFile,
  ScriptSummary,
} from '@shared/types/scripts.types'

/** The API row with its text resolved for this reader: what the screen renders.
 *  The stored values per language ride along below, for the edit form. */
export type ScriptDetailScript = Omit<
  ScriptSummary,
  'title' | 'description'
> & {
  title: PortableTextValue
  description: PortableTextValue | null
}

/** Everything the script detail screen renders, resolved server-side so the
 * components only ever receive plain data (no fetching, no cookies). */
export type ScriptDetailViewModel = {
  scriptId: string
  script: ScriptDetailScript
  /** What the author stored, per language — the edit form's initial values.
   *  `script.title`/`description` above are already resolved for this reader. */
  localizedTitle: LocalizedScriptText
  localizedDescription: LocalizedScriptText | null
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
  /** The subject's localized name from Sanity; `null` when it could not be
   *  read, and the component falls back to `script.subject.name`. */
  subjectName: string | null
  /** The professor chosen on the script, localized. `null` when the script has
   *  none or the subject no longer lists them. */
  professorName: string | null
  /** The professor's catalog page; `null` renders the name as plain text. */
  professorHref: string | null
}
