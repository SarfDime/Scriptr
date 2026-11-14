import type {
  AchievementMetric,
  AchievementRarity,
} from '../config/achievements'
import type { Tables } from './database.types'

/** `GET /api/achievement-definitions` returns the full row. */
export type AchievementDefinition = Tables<'achievement_definitions'>

/**
 * Body of `POST /api/achievement-definitions`. There is deliberately no
 * `entity_type`: only profiles earn achievements, so the API sets 'profile'.
 *
 * `studyId` is the definition's scope: a study id makes it count inside that
 * study, `null` (the default) makes it platform-wide.
 *
 * Title and description are not client input: the id has to have an entry in
 * `ACHIEVEMENTS_STRINGS_PACK.copy` (`shared/strings/achievements-strings.ts`),
 * and the API stores that copy on the row as the fallback snapshot.
 */
export type AchievementDefinitionInput = {
  id: string
  metric: AchievementMetric
  threshold: number
  rarity: AchievementRarity
  /** The study it counts in, or `null`/omitted for a platform-wide definition. */
  studyId?: string | null
}

/** Body of `PATCH /api/achievement-definitions/:id`. The id is immutable. */
export type AchievementDefinitionPatch = Partial<
  Omit<AchievementDefinitionInput, 'id'>
>

export type AchievementDefinitionMutationResponse = {
  success: true
  achievement_definition: AchievementDefinition
}
