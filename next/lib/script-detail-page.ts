import type { ScriptSummary } from '@shared/types/scripts.types'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSessionRequired } from '@/lib/api/auth-api'
import { getScriptComments } from '@/lib/api/comments-api'
import { getFavorite } from '@/lib/api/favorites-api'
import { ApiError } from '@/lib/api/next-api'
import { getScript } from '@/lib/api/scripts-api'
import { getMyScriptVote, getScriptVoteStats } from '@/lib/api/votes-api'
import { nextLogs } from '@/lib/logger'
import { sortFilesByPosition } from '@/lib/script-detail'
import { getSubjectPath } from '@/lib/subject-path'
import type { ScriptDetailViewModel } from '@/types/components/ScriptDetail.types'

export type ScriptDetailPageData = {
  detail: ScriptDetailViewModel
  comments: Awaited<ReturnType<typeof getScriptComments>>
  commentsUnavailable: boolean
}

type ScriptComments = Awaited<ReturnType<typeof getScriptComments>>

const EMPTY_COMMENTS: ScriptComments = {
  items: [],
  hasMore: false,
  totalCount: 0,
  totalCommentCount: 0,
}

type ViewerRead<T> = { value: T; failed: boolean }

const getSessionExpiresAt = (sessionCookie: string | undefined) => {
  if (!sessionCookie) return null

  try {
    const session: unknown = JSON.parse(sessionCookie)
    if (
      typeof session !== 'object' ||
      session === null ||
      !('expires_at' in session)
    ) {
      return null
    }

    const expiresAt = session.expires_at
    if (typeof expiresAt === 'number' && Number.isFinite(expiresAt)) {
      return expiresAt
    }
    if (typeof expiresAt === 'string' && expiresAt.trim()) {
      const parsedExpiresAt = Number(expiresAt)
      return Number.isFinite(parsedExpiresAt) ? parsedExpiresAt : null
    }
  } catch {
    return null
  }

  return null
}

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
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  const authCookie = cookieStore.get('sb-auth-token')?.value
  const sessionExpiresAt = getSessionExpiresAt(authCookie)
  const secondsUntilExpiry =
    sessionExpiresAt === null
      ? null
      : sessionExpiresAt - Math.floor(Date.now() / 1000)
  nextLogs({
    logLevel: 'info',
    message: `Script detail auth diagnostic: script=${scriptId} incomingAuthCookie=${authCookie !== undefined} sessionExpiresAt=${sessionExpiresAt ?? 'unknown'} secondsUntilExpiry=${secondsUntilExpiry ?? 'unknown'}`,
  })

  let script: ScriptSummary
  try {
    script = await getScript(scriptId, cookieHeader)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }

  const [voteStats, commentsResult, myVote, myFavorite, session, subjectHref] =
    await Promise.all([
      getScriptVoteStats(scriptId),
      getScriptComments(scriptId, cookieHeader)
        .then((comments) => ({ comments, unavailable: false }))
        .catch(() => ({ comments: EMPTY_COMMENTS, unavailable: true })),
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
      canManage:
        session.value?.user?.id === script.author_id ||
        session.value?.user?.role === 'admin',
      isSaved: myFavorite.value !== null,
      viewerDataFailed,
      subjectHref,
    },
    comments: commentsResult.comments,
    commentsUnavailable: commentsResult.unavailable,
  }
}
