import type { SanityImageType } from '@shared/types/sanity-transform.types'

export type PersonSummary = {
  _id: string
  name: string
  title?: string
  picture?: SanityImageType
}
