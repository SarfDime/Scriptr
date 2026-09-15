import type { PortableTextValue } from '@shared/types/portable-text.types'
import type {
  MinimalSubjectQueryTypedResult,
  SubjectDetailQueryResult,
} from '@shared/types/sanity.types'
import type { WithResolvedSanityData } from '@shared/types/sanity-transform.types'
import type { BoxProps } from '@/components/common/Box'

export type MinimalSubject = NonNullable<
  WithResolvedSanityData<MinimalSubjectQueryTypedResult>
>

export type SubjectDetail = NonNullable<
  WithResolvedSanityData<SubjectDetailQueryResult>
>

export type SubjectExamSession = 'january' | 'june' | 'september'
export type SubjectSemester = SubjectDetail['semester']

export type SubjectsSidebarProps = Omit<BoxProps, 'content' | 'as'> & {
  subjects: Array<MinimalSubject>
  content: PortableTextValue
}
