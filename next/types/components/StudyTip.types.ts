import type { PortableTextValue } from '@shared/types/portable-text.types'

/** A study tip as the navbar shows it: a rich text heading and rich text body,
 * both authored in Sanity. */
export type StudyTipData = {
  title: PortableTextValue
  content: PortableTextValue
}

/** The navbar's tip rotation: every published tip plus the UTC day the layout
 * rendered, so the client can match the server's HTML before switching to its
 * own clock. */
export type StudyTipRotation = {
  tips: Array<StudyTipData>
  serverDay: number
}
