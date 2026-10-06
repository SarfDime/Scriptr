import type {
  UniversityDetailQueryResult,
  UniversityGalleryQueryResult,
} from '@shared/types/sanity.types'
import type { WithResolvedSanityData } from '@shared/types/sanity-transform.types'

export type UniversityGalleryData = Array<
  NonNullable<WithResolvedSanityData<UniversityGalleryQueryResult>>
>

export type UniversityDetail = NonNullable<
  WithResolvedSanityData<UniversityDetailQueryResult>
>
