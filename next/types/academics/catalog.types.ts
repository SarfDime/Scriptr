import type { CatalogHomeQueryResult } from '@shared/types/sanity.types'
import type { WithResolvedSanityData } from '@shared/types/sanity-transform.types'
import type { ReactNode } from 'react'

/** What the catalog home renders: the universities and the studies, as
 * `catalogHomeQuery` projects them. */
export type CatalogHome = NonNullable<
  WithResolvedSanityData<CatalogHomeQueryResult>
>

/** A compact overview card: the entity page's card reduced to its picture band,
 * name, one summary line and its place in the catalog. Every instance has the
 * same width and height, so a section reads as an even row. */
export type CatalogCardProps = {
  href: string
  /** What the card is, above the name ("University", "Faculty", "Study"). */
  eyebrow: string
  title: string
  /** Counts under the name. */
  subtitle?: string | null
  /** Path line at the bottom (faculty • university). */
  caption?: string
  /** The entity's picture, filling the card's header band. */
  picture?: ReactNode
  /** The entity's logo, shown small beside the eyebrow. */
  logo?: ReactNode
}

export type CatalogHomeContentProps = {
  catalog: CatalogHome
}
