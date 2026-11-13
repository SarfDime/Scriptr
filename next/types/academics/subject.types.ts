import type {
  MinimalSubjectQueryTypedResult,
  SubjectByIdQueryResult,
  SubjectDetailQueryResult,
  SubjectPathQueryResult,
} from '@shared/types/sanity.types'
import type { WithResolvedSanityData } from '@shared/types/sanity-transform.types'
import type { ReactNode } from 'react'
import type { BoxProps } from '@/components/common/Box'
import type { SectionHeaderProps } from '@/types/components/SectionHeader.types'

export type MinimalSubject = NonNullable<
  WithResolvedSanityData<MinimalSubjectQueryTypedResult>
>

export type SubjectDetail = NonNullable<
  WithResolvedSanityData<SubjectDetailQueryResult>
>

export type SubjectById = NonNullable<
  WithResolvedSanityData<SubjectByIdQueryResult>
>

export type SubjectSidebarItem = Pick<
  MinimalSubject,
  | '_id'
  | 'slug'
  | 'name'
  | 'code'
  | 'credits'
  | 'year'
  | 'semester'
  | 'elective'
  | 'professors'
  | 'study'
>

/** Slugs of a subject and its ancestors — just enough to build its page path. */
export type SubjectPath = NonNullable<
  WithResolvedSanityData<SubjectPathQueryResult>
>

export type SubjectsSidebarProps = Omit<
  BoxProps,
  'content' | 'as' | 'title'
> & {
  subjects: Array<SubjectSidebarItem>
  title?: string
  /** Shown under the title when there are subjects. */
  subtitle?: string
  /** Shown under the title instead of the list when `subjects` is empty. */
  emptyMessage?: string
  /** Rendered between the header and the list, whether or not there are
   * subjects — for controls such as view toggles and filters. */
  toolbar?: ReactNode
  headerProps?: Partial<SectionHeaderProps>
}
