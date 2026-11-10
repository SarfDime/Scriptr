import type {
  LinkSelectorProps,
  NavItemPresentationType,
} from '@shared/types/common.types'
import type { SanityImageType } from '@shared/types/sanity-transform.types'

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

export type { NavItemType, NavMenuType }
