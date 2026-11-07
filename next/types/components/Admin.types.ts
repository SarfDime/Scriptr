import type { AchievementDefinition } from '@shared/types/achievements.types'
import type { FlagListResponse, FlagStatus } from '@shared/types/flags.types'
import type {
  AdminProfilesListResponse,
  AdminProfilesQuery,
} from '@shared/types/profile.types'
import type { RatingType } from '@shared/types/ratings.types'
import type {
  LiftedRestrictionItem,
  RestrictionListItem,
} from '@shared/types/restrictions.types'

export type AdminFlagsViewModel = {
  flags: FlagListResponse
  status: FlagStatus
}

export type AdminRestrictionsViewModel = {
  restrictions: Array<RestrictionListItem>
  lifted: Array<LiftedRestrictionItem>
}

export type AdminRatingTypesViewModel = {
  ratingTypes: Array<RatingType>
}

export type AdminAchievementDefinitionsViewModel = {
  achievementDefinitions: Array<AchievementDefinition>
}

/** The admin user manager: the first page the loader rendered, plus the query
 * it used, so the panel's controls start where the server did. */
export type AdminUsersViewModel = {
  page: AdminProfilesListResponse
  query: AdminProfilesQuery
}
