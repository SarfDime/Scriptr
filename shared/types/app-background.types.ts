// The website's background pick (next/components/ui/app-background/AppBackground.tsx).
// The shapes come from TypeGen results, so they follow the `website` schema and the
// background and skybox documents rather than a hand-kept copy.

import type {
  WebsiteBackgroundQueryResult,
  WebsiteSkyboxQueryResult,
} from './sanity.types'

/** The background document the website settings point at; null when unset. */
export type WebsiteBackground = NonNullable<WebsiteBackgroundQueryResult>

/** The skybox document the website settings point at; null when unset. */
export type WebsiteSkybox = NonNullable<WebsiteSkyboxQueryResult>
