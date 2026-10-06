import type { SubjectDetailQueryResult } from './sanity.types'
import type { WithResolvedSanityData } from './sanity-transform.types'

type SubjectExamSession = 'january' | 'june' | 'september'
type SubjectSemester = NonNullable<
  WithResolvedSanityData<SubjectDetailQueryResult>
>['semester']

export type { SubjectExamSession, SubjectSemester }
