// The website's background pick (next/components/ui/app-background/AppBackground.tsx).
// The shape comes from the `websiteBackgroundQuery` TypeGen result, so it follows
// the `website` schema and the `starCanvas`/`christmasCanvas` documents rather than
// a hand-kept copy. The projection keeps `_type`, which is what the frontend uses
// to tell the two canvases apart.

import type { WebsiteBackgroundQueryResult } from './sanity.types'

/** The background document the website settings point at; null when unset. */
export type WebsiteBackground = NonNullable<WebsiteBackgroundQueryResult>
