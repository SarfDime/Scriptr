import type { AdminAchievementDefinitionsViewModel } from '@/types/components/Admin.types'
import { getAchievementDefinitions } from './api/achievement-definitions-api'

export const loadAdminAchievementDefinitionsPage = async (
  cookie: string
): Promise<AdminAchievementDefinitionsViewModel | null> => {
  try {
    const achievementDefinitions = await getAchievementDefinitions(cookie)
    return { achievementDefinitions }
  } catch {
    return null
  }
}
