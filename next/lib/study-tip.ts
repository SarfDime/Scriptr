import { SANITY_CACHE_TAGS } from '@shared/config/cache-tags'
import type { StudyTipsQueryResult } from '@shared/types/sanity.types'
import type { WithResolvedSanityData } from '@shared/types/sanity-transform.types'
import { getServerLocale } from '@/lib/server-strings'
import { fetchSanityData } from '@/sanity/lib/utils'
import { studyTipsQuery } from '@/sanity/queries/study-tip.queries'
import type { StudyTipData } from '@/types/components/StudyTip.types'

/** Every published study tip, in the order Sanity returns them. The navbar
 * picks one per render (`NavStudyTip`). A Sanity failure returns no tips so the
 * navbar simply shows none instead of taking the whole site down from the
 * layout (`fetchSanityData` logs the failure before rethrowing, so it is not
 * logged again here). */
export const getStudyTips = async (): Promise<Array<StudyTipData>> => {
  try {
    const tips = await fetchSanityData<
      WithResolvedSanityData<StudyTipsQueryResult>
    >({
      query: studyTipsQuery,
      locale: await getServerLocale(),
      fetchOrigin: 'getStudyTips()',
      tags: [SANITY_CACHE_TAGS.studyTip],
    })

    return tips.flatMap(({ title, content }) =>
      title && content ? [{ title, content }] : []
    )
  } catch {
    return []
  }
}
