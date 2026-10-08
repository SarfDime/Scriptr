import type { ScriptSummary } from '@shared/types/scripts.types'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/api/auth-api'
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

/** Loads everything the script detail page needs, triggering a 404 when the
 * script doesn't exist. Any other API failure propagates to `error.tsx`. */
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
      cookieHeader ? getMyScriptVote(scriptId, cookieHeader) : null,
      // Non-critical: a failed lookup must not take the page down, it just
      // renders the button as unsaved.
      cookieHeader
        ? getFavorite(scriptId, cookieHeader).catch(() => null)
        : null,
      cookieHeader ? getSession(cookieHeader).catch(() => null) : null,
      // Resolves the subject's real slug chain from Sanity; `null` (plain
      // text, no link) if anything is missing or Sanity is unavailable.
      getSubjectPath(script.subject?.sanity_id ?? null),
    ])

  return {
    detail: {
      scriptId,
      script,
      files: sortFilesByPosition(script.files),
      voteScore: voteStats.score,
      // GET /script/:scriptId/my-vote returns the raw votes row or `null` —
      // never `{ voted: boolean }`. "Has the current user voted" is
      // `myVote !== null`.
      hasVoted: myVote !== null,
      isAuthor: session?.user?.id === script.author_id,
      isSaved: myFavorite !== null,
      subjectHref,
    },
    comments,
  }
}
