import { apiRoutes } from '@shared/config/api-routes'
import type {
  AchievementDefinition,
  AchievementDefinitionInput,
  AchievementDefinitionMutationResponse,
  AchievementDefinitionPatch,
} from '@shared/types/achievements.types'
import { apiFetchRequired } from './next-api'

/** Admin screens always read fresh data. */
const NO_STORE = { cache: 'no-store' } as const

/** Public. Definitions are data (`achievement_definitions`), never hardcoded. */
export const getAchievementDefinitions = (cookie?: string) =>
  apiFetchRequired<Array<AchievementDefinition>>(
    apiRoutes.achievementDefinitions.index,
    {
      ...NO_STORE,
      ...(cookie ? { headers: { cookie } } : {}),
    }
  )

export const createAchievementDefinition = (
  input: AchievementDefinitionInput
) =>
  apiFetchRequired<AchievementDefinitionMutationResponse>(
    apiRoutes.achievementDefinitions.index,
    { method: 'POST', body: input }
  )

export const updateAchievementDefinition = (
  id: string,
  patch: AchievementDefinitionPatch
) =>
  apiFetchRequired<AchievementDefinitionMutationResponse>(
    apiRoutes.achievementDefinitions.byId(id),
    { method: 'PATCH', body: patch }
  )

export const removeAchievementDefinition = (id: string) =>
  apiFetchRequired<{ success: true; message: string }>(
    apiRoutes.achievementDefinitions.byId(id),
    { method: 'DELETE' }
  )
