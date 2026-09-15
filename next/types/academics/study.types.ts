import type {
  MinimalStudyTypedQueryResult,
  StudyDetailQueryResult,
} from '@shared/types/sanity.types'
import type { WithResolvedSanityData } from '@shared/types/sanity-transform.types'
import type { BoxProps } from '@/components/common/Box'

type MinimalStudy = NonNullable<
  WithResolvedSanityData<MinimalStudyTypedQueryResult>
>

type StudyDetail = NonNullable<WithResolvedSanityData<StudyDetailQueryResult>>

type StudyOverviewCardProps = {
  study: StudyDetail
} & BoxProps

export type { MinimalStudy, StudyDetail, StudyOverviewCardProps }
