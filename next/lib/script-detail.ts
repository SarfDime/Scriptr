import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import type { ScriptFile, ScriptSummary } from '@shared/types/scripts.types'

export const sortFilesByPosition = (
  files: Array<ScriptFile>
): Array<ScriptFile> => [...files].sort((a, b) => a.position - b.position)

/** Hostname for a reading link's headline; falls back to the raw string when
 * the value isn't a parseable URL so a malformed entry still renders. */
export const getLinkLabel = (link: string): string => {
  try {
    return new URL(link).hostname.replace(/^www\./, '')
  } catch {
    return link
  }
}

/** The link without its scheme and `www.`, shown under the headline. */
export const getLinkAddress = (link: string): string =>
  link.replace(/^https?:\/\/(www\.)?/, '')

/** Display data for a script's uploader; copes with a deleted account. */
export const getAuthorDisplay = (author: ScriptSummary['author']) => ({
  name:
    author?.full_name ?? author?.username ?? SCRIPT_STRINGS.info.deletedUser,
  username: author?.username ?? null,
  avatarUrl: author?.avatar_url ?? null,
  profileHref: author?.username
    ? `/user/${encodeURIComponent(author.username)}`
    : null,
})
