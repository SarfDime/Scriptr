import { SANITY_CACHE_TAGS } from '@shared/config/cache-tags'
import type { StudyTipsQueryResult } from '@shared/types/sanity.types'
import type { WithResolvedSanityData } from '@shared/types/sanity-transform.types'
import { dayNumber } from '@/lib/daily-pick'
import { getServerLocale } from '@/lib/server-strings'
import { fetchSanityData } from '@/sanity/lib/utils'
import { studyTipsQuery } from '@/sanity/queries/study-tip.queries'
import type { StudyTipRotation } from '@/types/components/StudyTip.types'

/** Every published study tip, in the stable order the navbar rotates through
 * by UTC day, plus the day this render was built for. A Sanity failure returns
 * no tips so the navbar simply shows none instead of taking the whole site down
 * from the layout (`fetchSanityData` logs the failure before rethrowing, so it
 * is not logged again here). */
export const getStudyTipRotation = async (): Promise<StudyTipRotation> => {
  const serverDay = dayNumber(Date.now())

  try {
    const tips = await fetchSanityData<
      WithResolvedSanityData<StudyTipsQueryResult>
    >({
      query: studyTipsQuery,
      locale: await getServerLocale(),
      fetchOrigin: 'getStudyTipRotation()',
      tags: [SANITY_CACHE_TAGS.studyTip],
    })

    return {
      serverDay,
      tips: tips.flatMap(({ title, content }) =>
        title && content ? [{ title, content }] : []
      ),
    }
  } catch {
    return { tips: [], serverDay }
  }
}
