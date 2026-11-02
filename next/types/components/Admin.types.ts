import type { AchievementDefinition } from '@shared/types/achievements.types'
import type { FlagListResponse, FlagStatus } from '@shared/types/flags.types'
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
