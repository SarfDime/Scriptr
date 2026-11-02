'use client'

import { getAchievementCopy } from '@shared/config/achievements'
import { ACHIEVEMENTS_STRINGS } from '@shared/strings/achievements-strings'
import type { ProfileAchievement } from '@shared/types/profile.types'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Popover } from '@/components/ui/Popover'
import {
  ACHIEVEMENT_RARITY_PALETTES,
  getAchievementIcon,
  resolveAchievementRarity,
} from '@/lib/achievement-display'
import { cn } from '@/lib/common-utils'
import { Button } from '../common/Button'
import { Badge } from '../ui/Badge'
import { Divider } from '../ui/Divider'

/** Fixed locale and time zone so server and client render the same text. */
const formatEarnedDate = (earnedAt: string) =>
  new Date(earnedAt).toLocaleDateString('en-GB', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  })

/**
 * A profile's earned achievements as small badges with a hover/focus popover.
 * Renders nothing when there are none. Callers pass them already ordered (see
 * `sortAchievements`). A client leaf only because the popover tracks hover and
 * focus.
 */
export const AchievementBadges = ({
  achievements,
}: {
  achievements: Array<ProfileAchievement>
}) => {
  if (achievements.length === 0) return null

  return (
    <Box
      as='ul'
      aria-label={ACHIEVEMENTS_STRINGS.groupLabel}
      className='flex min-w-0 flex-wrap gap-1.5'
    >
      {achievements.map(({ achievement_id, earned_at, achievement }) => {
        if (!achievement) return null
        const rarity = resolveAchievementRarity(achievement.rarity)
        const rarityLabel = ACHIEVEMENTS_STRINGS.rarity[rarity]
        const copy = getAchievementCopy(achievement_id, achievement)
        const Icon = getAchievementIcon(achievement_id, achievement.metric)

        return (
          <Box as='li' key={achievement_id}>
            <Popover
              placement='left'
              trigger={
                <Button
                  type='button'
                  aria-label={ACHIEVEMENTS_STRINGS.badgeLabel(
                    copy.title,
                    rarityLabel
                  )}
                  className={cn(
                    'button',
                    ACHIEVEMENT_RARITY_PALETTES[rarity],
                    'rounded-md p-0.5'
                  )}
                >
                  <Icon className='h-6 w-6 overwrite fill-current' />
                </Button>
              }
            >
              <Box className='ui-above-inside ui-stack w-56 gap-1.5 bg-background-200 p-3'>
                <Text className='ui-title font-bold'>{copy.title}</Text>

                {copy.description && (
                  <Text className='ui-large-caption'>{copy.description}</Text>
                )}
                <Divider />

                <Text className='ui-caption'>
                  {ACHIEVEMENTS_STRINGS.earnedOn(formatEarnedDate(earned_at))}
                </Text>
                <Text className='ui-caption ui-cluster gap-1'>
                  {ACHIEVEMENTS_STRINGS.rarityLabel}
                  <Badge
                    className='ui-caption'
                    colorPalette={ACHIEVEMENT_RARITY_PALETTES[rarity]}
                  >
                    {rarityLabel}
                  </Badge>
                </Text>
              </Box>
            </Popover>
          </Box>
        )
      })}
    </Box>
  )
}
