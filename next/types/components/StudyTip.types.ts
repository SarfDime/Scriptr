import type { PortableTextValue } from '@shared/types/portable-text.types'

/** A study tip as the navbar shows it: a rich text heading and rich text body,
 * both authored in Sanity. */
export type StudyTipData = {
  title: PortableTextValue
  content: PortableTextValue
}
