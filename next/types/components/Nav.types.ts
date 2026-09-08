import type {
  LinkSelectorProps,
  SanityImageType,
  SharedSectionDataType,
} from '../common.types'

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
