import type { LocaleId } from '@shared/config/localization-constants'
import type { ProfileScriptSummary } from '@shared/types/profile.types'
import type { ScriptSummary } from '@shared/types/scripts.types'
import { pickLocalizedPortableText } from '@shared/utils/localized-portable-text'
import type { ScriptDetail } from '@/types/components/Scripts.types'

/** Localized subject names by Sanity id, for the cards in one list. See
 * `getScriptSubjectNames`. */
export type SubjectNameMap = ReadonlyMap<string, string>

/** The name from Sanity when the list resolved one, else the single name the
 * script row carries. */
const resolveSubjectName = (
  subject: { name: string; sanity_id?: string | null } | null,
  subjectNames?: SubjectNameMap
): string =>
  (subject?.sanity_id && subjectNames?.get(subject.sanity_id)) ||
  subject?.name ||
  ''

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
 * concept for scripts, only the upvote score (see
 * docs/ARCHITECTURE-SCRIPTS-UPLOADS.md on votes vs. comment-level likes).
 *
 * `professor` and `year` are left undefined — see PROFILE_SCRIPT_FIELDS'
 * comment for why neither is obtainable via a simple join today. Both are
 * optional on ScriptDetail, and every other script-list endpoint in this
 * app already omits them for the same reason.
 *
 * `subjectNames` carries the localized names the caller resolved from Sanity;
 * without it the card falls back to the row's single Postgres name.
 */
export const toScriptDetail = (
  script: ProfileScriptSummary,
  locale: LocaleId,
  subjectNames?: SubjectNameMap
): ScriptDetail => ({
  id: script.id,
  slug: script.slug,
  /** A script page belongs to its study's site; without this the card links to
   * the catalog path, which only redirects there. */
  siteSlug: script.study?.site_slug ?? null,
  title: pickLocalizedPortableText(script.title, locale) ?? [],
  description:
    pickLocalizedPortableText(script.description, locale) ?? undefined,
  subject: resolveSubjectName(script.subject, subjectNames),
  author: script.author?.full_name || script.author?.username || '',
  updatedAt: new Date(script.updated_at),
  likes: script.vote_score,
  comments: script.comments[0]?.count ?? 0,
  downloads: script.download_count,
  files: script.files,
})

export const toScriptDetails = (
  scripts: Array<ProfileScriptSummary>,
  locale: LocaleId,
  subjectNames?: SubjectNameMap
): Array<ScriptDetail> =>
  scripts.map((script) => toScriptDetail(script, locale, subjectNames))

/** Adapts the shared scripts-list response for the interactive script section. */
export const toScriptSummaryDetails = (
  scripts: Array<ScriptSummary>,
  locale: LocaleId,
  subjectNames?: SubjectNameMap
): Array<ScriptDetail> =>
  scripts.map((script) => ({
    id: script.id,
    slug: script.slug,
    siteSlug: script.subject?.study?.site_slug ?? null,
    title: pickLocalizedPortableText(script.title, locale) ?? [],
    description:
      pickLocalizedPortableText(script.description, locale) ?? undefined,
    subject: resolveSubjectName(script.subject, subjectNames),
    author: script.author?.full_name || script.author?.username || '',
    updatedAt: new Date(script.updated_at),
    likes: script.vote_score,
    comments: script.comments[0]?.count ?? 0,
    downloads: script.download_count,
    files: script.files,
  }))
