/// <reference path="./sanity-client-stub.d.ts" />

import type { RichTextLite } from './sanity.types'
import type { WithResolvedSanityData } from './sanity-transform.types'

export type PortableTextValue = NonNullable<
  WithResolvedSanityData<RichTextLite>
>
