import type { SubjectDetailQueryResult } from './sanity.types'
import type { WithResolvedSanityData } from './sanity-transform.types'

/** Exam sessions a script can be filed under. Subjects have semesters; scripts
 * have sessions. */
type ExamSession = 'january' | 'june' | 'september'
type SubjectSemester = NonNullable<
  WithResolvedSanityData<SubjectDetailQueryResult>
>['semester']

export type { ExamSession, SubjectSemester }
