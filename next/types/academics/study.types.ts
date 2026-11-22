import type {
  MinimalStudyTypedQueryResult,
  StudyDetailQueryResult,
} from '@shared/types/sanity.types'
import type { WithResolvedSanityData } from '@shared/types/sanity-transform.types'

type MinimalStudy = NonNullable<
  WithResolvedSanityData<MinimalStudyTypedQueryResult>
>

type StudyDetail = NonNullable<WithResolvedSanityData<StudyDetailQueryResult>>

export type { MinimalStudy, StudyDetail }
