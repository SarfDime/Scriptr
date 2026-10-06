import type {
  FacultyDetailQueryResult,
  MinimalFacultyTypedQueryResult,
} from '@shared/types/sanity.types'
import type { WithResolvedSanityData } from '@shared/types/sanity-transform.types'
import type { BoxProps } from '@/components/common/Box'

type MinimalFaculty = NonNullable<
  WithResolvedSanityData<MinimalFacultyTypedQueryResult>
>
type FacultyDetail = NonNullable<
  WithResolvedSanityData<FacultyDetailQueryResult>
>

type FacultyOverviewCardProps = {
  faculty: FacultyDetail
} & BoxProps

export type { FacultyDetail, FacultyOverviewCardProps, MinimalFaculty }
