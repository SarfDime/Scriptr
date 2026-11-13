import type {
  LinkSelectorProps,
  NavItemPresentationType,
} from '@shared/types/common.types'
import type { StudyLogosQueryResult } from '@shared/types/sanity.types'
import type {
  SanityImageType,
  WithResolvedSanityData,
} from '@shared/types/sanity-transform.types'
import type { StudyTipRotation } from '@/types/components/StudyTip.types'

type NavItemType = {
  navItemSlug: string
} & LinkSelectorProps &
  NavItemPresentationType

interface NavMenuType {
  stringTitle: string
  stringSubtitle: string
  websiteLogo: SanityImageType
  navItems?: Array<NavItemType>
}

/** One row of `studyLogosQuery`: the site handle and the study's logo. */
type NavStudyLogoEntry = NonNullable<
  WithResolvedSanityData<StudyLogosQueryResult>
>[number]

/** A study's site handle → the logo the navbar shows beside its name. Kept
 * separate from `NavMenuType`: the menu is Sanity content, this is a cached
 * catalog read the layout hands down so the enrolled-studies list needs no
 * request of its own. */
type NavStudyLogos = Record<string, SanityImageType>

type NavBarProps = NavMenuType & {
  studyLogos?: NavStudyLogos
  /** The published study tips and the UTC day the layout rendered them. */
  studyTip?: StudyTipRotation
}

export type {
  NavBarProps,
  NavItemType,
  NavMenuType,
  NavStudyLogoEntry,
  NavStudyLogos,
}
