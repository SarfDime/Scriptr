import type { SanityImageType } from '../common.types'

export type PersonSummary = {
  _id: string
  name: string
  title?: string
  picture?: SanityImageType
}
