import type { ScriptSummary } from '@shared/types/scripts.types'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSessionRequired } from '@/lib/api/auth-api'
import { getScriptComments } from '@/lib/api/comments-api'
import { getFavorite } from '@/lib/api/favorites-api'
import { ApiError } from '@/lib/api/next-api'
import { getScript } from '@/lib/api/scripts-api'
import { getMyScriptVote, getScriptVoteStats } from '@/lib/api/votes-api'
import { sortFilesByPosition } from '@/lib/script-detail'
import { getSubjectPath } from '@/lib/subject-path'
import type { ScriptDetailViewModel } from '@/types/components/ScriptDetail.types'

export type ScriptDetailPageData = {
  detail: ScriptDetailViewModel
  comments: Awaited<ReturnType<typeof getScriptComments>>
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

/** Loads everything the script detail page needs, triggering a 404 when the
 * script doesn't exist. A failed script/comments read propagates to
 * `error.tsx`; a failed viewer-specific read only sets `viewerDataFailed`. */
export const loadScriptDetailPage = async (
  scriptId: string
): Promise<ScriptDetailPageData> => {
  const cookieHeader = (await cookies()).toString()

  let script: ScriptSummary
  try {
    script = await getScript(scriptId, cookieHeader)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }

  const [voteStats, comments, myVote, myFavorite, session, subjectHref] =
    await Promise.all([
      getScriptVoteStats(scriptId),
      getScriptComments(scriptId, cookieHeader),
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
      // Resolves the subject's real slug chain from Sanity; `null` (plain
      // text, no link) if anything is missing or Sanity is unavailable.
      getSubjectPath(script.subject?.sanity_id ?? null),
    ])

  const viewerDataFailed = myVote.failed || myFavorite.failed || session.failed

  return {
    detail: {
      scriptId,
      script,
      files: sortFilesByPosition(script.files),
      voteScore: voteStats.score,
      // GET /script/:scriptId/my-vote returns the raw votes row or `null` —
      // never `{ voted: boolean }`. "Has the current user voted" is
      // `myVote !== null`.
      hasVoted: myVote.value !== null,
      isAuthor: session.value?.user?.id === script.author_id,
      isSaved: myFavorite.value !== null,
      viewerDataFailed,
      subjectHref,
    },
    comments,
  }
}
