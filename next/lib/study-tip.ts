import type { StudyTipsQueryResult } from '@shared/types/sanity.types'
import type { WithResolvedSanityData } from '@shared/types/sanity-transform.types'
import { fetchSanityData } from '@/sanity/lib/utils'
import { studyTipsQuery } from '@/sanity/queries/study-tip.queries'
import type { StudyTipData } from '@/types/components/StudyTipCard.types'

const MS_PER_DAY = 86_400_000

/** One item per UTC day, cycling through `items` in their given order. Pure
 * and deterministic, so the server render is the same for everyone that day
 * (no client-side randomness, no hydration mismatch). */
export const pickDailyItem = <T>(
  items: ReadonlyArray<T>,
  now: number
): T | undefined => items[Math.floor(now / MS_PER_DAY) % items.length]

/** Today's study tip from Sanity, or `undefined` when there are no tips or the
 * fetch fails, in which case the card is simply not rendered. A Sanity miss
 * must never crash or blank the page it sits on (`fetchSanityData` logs the
 * failure before rethrowing, so it is not logged again here).
 *
 * Reads Sanity only, with no cookies or headers, but it is per request on
 * dynamic pages: on a static or ISR page the tip would freeze until
 * revalidation. */
export const getDailyStudyTip = async (): Promise<StudyTipData | undefined> => {
  try {
    const tips = await fetchSanityData<
      WithResolvedSanityData<StudyTipsQueryResult>
    >({ query: studyTipsQuery, fetchOrigin: 'getDailyStudyTip()' })

    return pickDailyItem(
      tips.flatMap(({ title, content }) =>
        title && content ? [{ title, content }] : []
      ),
      Date.now()
    )
  } catch {
    return undefined
  }
}
