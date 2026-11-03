import type { ScriptDetail } from './Scripts.types'

export type SearchPageViewModel = {
  query: string
  scripts: Array<ScriptDetail>
  /** The request failed, so an empty `scripts` means "unknown", not "no
   * matches" — the two must not share copy. */
  failed: boolean
}
