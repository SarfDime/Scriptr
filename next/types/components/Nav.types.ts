// type SharedPageData = {
//   siteName: string
//   pageSeo?: PageSeo
//   openGraphType: string
//   twitterCreator: string
//   twitterSite: string
//   twitterCardType: string
//   navigationMenu?: NavBarNavigationMenuType
//   websiteFeedbackModal?: FeedbackType
//   websiteEligibilityModals?: Array<EligibilityModalType & SharedSectionDataType>
//   footer?: FooterDataType
//   websiteFavicon?: SanityImageType
//   _updatedAt?: string
// }

import type {
  LinkSelectorProps,
  SharedSectionDataType,
} from '@shared/types/common.types'
import type { SanityImageType } from '@shared/types/sanity-transform.types'

type NavItemType = {
  navItemSlug: string
} & LinkSelectorProps &
  SharedSectionDataType

interface NavMenuType {
  stringTitle: string
  stringSubtitle: string
  websiteLogo: SanityImageType
  navItems?: Array<NavItemType>
}

export type { NavItemType, NavMenuType }
