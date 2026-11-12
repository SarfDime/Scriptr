import type { CatalogHomeQueryResult } from '@shared/types/sanity.types'
import type {
  SanityImageType,
  WithResolvedSanityData,
} from '@shared/types/sanity-transform.types'
import type { ComponentType } from 'react'
import type { SanityIconProps } from '@/types/component.types'
import type { ColorPaletteClass } from '../components/ColorPalettes.types'

/** What the catalog home renders: the universities and the studies, as
 * `catalogHomeQuery` projects them. */
export type CatalogHome = NonNullable<
  WithResolvedSanityData<CatalogHomeQueryResult>
>

/** The `sanityImage::full` projection every catalog entry carries. */
export type CatalogImage = Partial<SanityImageType>

/** A compact overview card: the entity page's card reduced to its picture band,
 * name, one summary line and its place in the catalog. The card fills the
 * width its column gives it and keeps a fixed height, so the cards in a
 * section read as an even column. */
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
  picture?: CatalogImage | null
  /** The entity's logo, shown small beside the eyebrow (and centered when
   * there is no picture). */
  logo?: CatalogImage | null
  /** Eager-loads the picture; only the first card above the fold needs it. */
  priority?: boolean
  /** The palette the card's badge and hover accent use. */
  colorPalette: ColorPaletteClass
}

/** One column of the home directory: a heading, its cards, or its empty line. */
export type CatalogSectionProps = {
  title: string
  subtitle: string
  empty: string
  icon: ComponentType<SanityIconProps>
  cards: Array<CatalogCardProps & { key: string }>
  /** Eager-loads the first picture in this section. */
  priority?: boolean
  /** The palette the sections's badge and hover accent use. */
  colorPalette: ColorPaletteClass
}

export type CatalogHomeContentProps = {
  catalog: CatalogHome
}
