import type { PortableTextValue } from '@shared/types/portable-text.types'
import type {
  MinimalSubjectQueryTypedResult,
  SubjectByIdQueryResult,
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

export type SubjectById = NonNullable<
  WithResolvedSanityData<SubjectByIdQueryResult>
>

export type SubjectsSidebarProps = Omit<BoxProps, 'content' | 'as'> & {
  subjects: Array<MinimalSubject>
  content: PortableTextValue
}
