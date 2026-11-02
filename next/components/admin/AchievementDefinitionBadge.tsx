import type { AchievementRarity } from '@shared/config/achievements'
import { createElement } from 'react'
import { Box } from '@/components/common/Box'
import {
  ACHIEVEMENT_RARITY_PALETTES,
  getAchievementIcon,
} from '@/lib/achievement-display'
import { cn } from '@/lib/common-utils'

/** A badge as profiles render it: the metric's icon in the rarity's palette. */
export const AchievementDefinitionBadge = ({
  achievementId,
  metric,
  rarity,
}: {
  achievementId: string
  metric: string
  rarity: AchievementRarity
}) => {
  const Icon = getAchievementIcon(achievementId, metric)
  return (
    <Box
      aria-hidden
      className={cn(
        ACHIEVEMENT_RARITY_PALETTES[rarity],
        'block h-7 w-7 shrink-0 rounded-md p-1'
      )}
    >
      {/* createElement, not <Icon/>: the component comes from a lookup, and the
          React Compiler lint reads a capitalised local as one made in render. */}
      {createElement(Icon, { className: 'h-full w-full overwrite' })}
    </Box>
  )
}
