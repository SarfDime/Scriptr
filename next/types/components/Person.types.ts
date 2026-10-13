import type { SanityImageType } from '@shared/types/sanity-transform.types'

export type PersonSummary = {
  _id: string
  name: string
  title?: string
  /** Where the name links to, for layouts that render a link. */
  href?: string
  picture?: SanityImageType
}
