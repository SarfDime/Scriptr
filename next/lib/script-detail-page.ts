import type { ScriptSummary } from '@shared/types/scripts.types'
import { canModerateStudy } from '@shared/utils/api.utils'
import { pickLocalizedPortableText } from '@shared/utils/localized-portable-text'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { getSessionRequired } from '@/lib/api/auth-api'
import { getScriptComments } from '@/lib/api/comments-api'
import { getFavorite } from '@/lib/api/favorites-api'
import { ApiError } from '@/lib/api/next-api'
import { getScript } from '@/lib/api/scripts-api'
import { getMyScriptVote, getScriptVoteStats } from '@/lib/api/votes-api'
import { EMPTY_COMMENT_PAGE } from '@/lib/comments/empty-comment-page'
import { sortFilesByPosition } from '@/lib/script-detail'
import { getServerLocale } from '@/lib/server-strings'
import { getSubjectRef } from '@/lib/subject-ref'
import type { ScriptDetailViewModel } from '@/types/components/ScriptDetail.types'

export type ScriptDetailPageData = {
  detail: ScriptDetailViewModel
  comments: Awaited<ReturnType<typeof getScriptComments>>
  commentsUnavailable: boolean
}

/**
 * The one read that decides whether the page exists, and the first thing the
 * page's boundary resolves: the route's URL is reader-supplied, so the shell is
 * already sent and a missing script answers a soft `404` (`noindex`) rather than
 * a status.
 *
 * The segment takes a slug or a legacy id: the API resolves both, and the page
 * redirects the id form to the slug, so the address people share and the
 * address search engines index are the same one.
 */
export const loadScriptDetailScript = async (
  identifier: string
): Promise<ScriptSummary> => {
  try {
    return await getScript(identifier)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }
}

type ViewerRead<T> = { value: T; failed: boolean }

/** Reads something that depends on who is signed in. No cookie, or a `401`,
 * means the viewer is signed out and `signedOut` is used. Any other failure is
 * reported as `failed` (with `signedOut` as the placeholder value) so the page
 * still renders, and the vote/save actions are disabled with a toast instead
 * of passing the placeholder off as "not voted", "not saved" or "not the
 * author". */
const readForViewer = async <T>(
  cookieHeader: string,
  read: (cookie: string) => Promise<T>,
  signedOut: T
): Promise<ViewerRead<T>> => {
  if (!cookieHeader) return { value: signedOut, failed: false }

  try {
    return { value: await read(cookieHeader), failed: false }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { value: signedOut, failed: false }
    }
    return { value: signedOut, failed: true }
  }
}

/** Loads the rest of the script detail page for an already-resolved script.
 * A failed comments read is contained; a failed viewer-specific read only sets
 * `viewerDataFailed`.
 *
 * Everything here is per reader — the session, their vote, their saves — so the
 * render waits for the request. The page calls this inside a `<Suspense>`
 * boundary. */
export const loadScriptDetailPage = async (
  scriptId: string,
  script: ScriptSummary
): Promise<ScriptDetailPageData> => {
  await connection()

  const cookieHeader = (await cookies()).toString()

  const [voteStats, commentsResult, myVote, myFavorite, session, subjectRef] =
    await Promise.all([
      getScriptVoteStats(scriptId),
      getScriptComments(scriptId, cookieHeader)
        .then((comments) => ({ comments, unavailable: false }))
        .catch(() => ({ comments: EMPTY_COMMENT_PAGE, unavailable: true })),
      readForViewer(
        cookieHeader,
        (cookie) => getMyScriptVote(scriptId, cookie),
        null
      ),
      readForViewer(
        cookieHeader,
        (cookie) => getFavorite(scriptId, cookie),
        null
      ),
      readForViewer(cookieHeader, getSessionRequired, null),
      // Resolves the subject's real slug chain and its localized name from
      // Sanity; `null` (plain text, and the name the API already carries) if
      // anything is missing or Sanity is unavailable.
      getSubjectRef(script.subject?.sanity_id ?? null),
    ])

  const viewerDataFailed = myVote.failed || myFavorite.failed || session.failed
  const locale = await getServerLocale()

  return {
    detail: {
      scriptId,
      // Resolved once, here: every component below renders text, not a map.
      script: {
        ...script,
        title: pickLocalizedPortableText(script.title, locale) ?? [],
        description: pickLocalizedPortableText(script.description, locale),
      },
      localizedTitle: script.title,
      localizedDescription: script.description,
      files: sortFilesByPosition(script.files),
      voteScore: voteStats.score,
      // GET /script/:scriptId/my-vote returns the raw votes row or `null` —
      // never `{ voted: boolean }`. "Has the current user voted" is
      // `myVote !== null`.
      hasVoted: myVote.value !== null,
      isAuthor: session.value?.user?.id === script.author_id,
      canManage:
        session.value?.user?.id === script.author_id ||
        canModerateStudy(session.value?.user, script.study_id),
      isSaved: myFavorite.value !== null,
      viewerDataFailed,
      /** `null` renders the subject as plain text. */
      subjectHref: subjectRef?.href ?? null,
      /** The subject's name in this reader's language; `null` falls back to
       *  the single name the API carries. */
      subjectName: subjectRef?.name ?? null,
    },
    comments: commentsResult.comments,
    commentsUnavailable: commentsResult.unavailable,
  }
}
