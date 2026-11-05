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
  sortAchievements,
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

const MAX_FLAT_BADGES = 4

type AchievementIcon = ReturnType<typeof getAchievementIcon>

type BadgeModel = {
  id: string
  /** The achievement's type; achievements of one type share an icon family. */
  group: string
  title: string
  description: string | null
  earnedAt: string
  rarity: ReturnType<typeof resolveAchievementRarity>
  rarityLabel: string
  icon: AchievementIcon
}

const toBadge = (entry: ProfileAchievement): BadgeModel | null => {
  const { achievement } = entry
  if (!achievement) return null

  const rarity = resolveAchievementRarity(achievement.rarity)
  const copy = getAchievementCopy(entry.achievement_id, achievement)

  return {
    id: entry.achievement_id,
    group: achievement.metric,
    title: copy.title,
    description: copy.description,
    earnedAt: entry.earned_at,
    rarity,
    rarityLabel: ACHIEVEMENTS_STRINGS.rarity[rarity],
    icon: getAchievementIcon(entry.achievement_id, achievement.metric),
  }
}

const BadgeButton = ({
  badge,
  ariaLabel,
  className,
}: {
  badge: BadgeModel
  ariaLabel?: string
  className?: string
}) => {
  const Icon = badge.icon

  return (
    <Button
      type='button'
      aria-label={
        ariaLabel ??
        ACHIEVEMENTS_STRINGS.badgeLabel(badge.title, badge.rarityLabel)
      }
      className={cn(
        'button',
        ACHIEVEMENT_RARITY_PALETTES[badge.rarity],
        'rounded-md p-0.5',
        className
      )}
    >
      <Icon className='h-6 w-6 overwrite fill-current' />
    </Button>
  )
}

/** One badge with its detail popover. */
const AchievementBadge = ({ badge }: { badge: BadgeModel }) => (
  <Popover placement='left' trigger={<BadgeButton badge={badge} />}>
    <Box className='ui-above-inside ui-stack w-56 gap-1.5 bg-background-200 p-3'>
      <Text
        className={cn(
          'ui-title font-bold',
          `${ACHIEVEMENT_RARITY_PALETTES[badge.rarity]}-nb`,
          'bg-transparent!'
        )}
      >
        {badge.title}
      </Text>

      {badge.description && (
        <Text className='ui-large-caption'>{badge.description}</Text>
      )}
      <Divider />

      <Text className='ui-caption'>
        {ACHIEVEMENTS_STRINGS.earnedOn(formatEarnedDate(badge.earnedAt))}
      </Text>
      <Text className='ui-caption ui-cluster gap-1'>
        {ACHIEVEMENTS_STRINGS.rarityLabel}
        <Badge
          className='ui-caption'
          colorPalette={ACHIEVEMENT_RARITY_PALETTES[badge.rarity]}
        >
          {badge.rarityLabel}
        </Badge>
      </Text>
    </Box>
  </Popover>
)

/**
 * A type's badges as one tile: the best of them, plus a count. Hovering or
 * focusing the tile opens a tray with the whole type beside it, where every
 * badge shows its own popover.
 */
const AchievementStack = ({ badges }: { badges: Array<BadgeModel> }) => {
  const best = badges[0]
  if (!best) return null
  const rest = badges.slice(1)

  return (
    <Box className='group/stack relative'>
      <BadgeButton
        badge={best}
        ariaLabel={ACHIEVEMENTS_STRINGS.stackLabel(best.title, rest.length)}
      />
      <Text
        aria-hidden
        className={cn(
          'ui-caption ui-center pointer-events-none absolute -top-1.5 -right-1.5',
          'h-4 min-w-4 rounded-full border border-background-400 bg-background-200 px-1',
          'text-[0.6875rem] leading-none',
          'transition-opacity group-hover/stack:opacity-0 group-focus-within/stack:opacity-0'
        )}
      >
        {ACHIEVEMENTS_STRINGS.stackCount(rest.length)}
      </Text>
      <Box
        className={cn(
          'ui-above absolute top-1.5 left-[70%] z-20 ml-1 hidden w-32',
          'flex-wrap items-center gap-1.5 bg-background-250 p-1.5',
          'group-hover/stack:flex group-focus-within/stack:flex'
        )}
      >
        {badges.map((badge) => (
          <AchievementBadge key={badge.id} badge={badge} />
        ))}
      </Box>
    </Box>
  )
}

/**
 * A profile's earned achievements, as badges with a hover/focus popover.
 * Renders nothing when there are none. Callers pass them already ordered (see
 * `sortAchievements`), so the first badge of a type is its rarest. A client
 * leaf only because the popover tracks hover and focus.
 */
export const AchievementBadges = ({
  achievements,
}: {
  achievements: Array<ProfileAchievement>
}) => {
  // Re-sorted here as well as by the caller so a stack is led by the rarest
  // badge of its type — the placeholders are appended, not ordered — and the
  // tile that stays visible is the most valuable one.
  const badges = sortAchievements(achievements)
    .map(toBadge)
    .filter((badge): badge is BadgeModel => badge !== null)

  if (badges.length === 0) return null

  const groups = new Map<string, Array<BadgeModel>>()
  if (badges.length > MAX_FLAT_BADGES) {
    for (const badge of badges) {
      const group = groups.get(badge.group)
      if (group) group.push(badge)
      else groups.set(badge.group, [badge])
    }
  } else {
    for (const badge of badges) groups.set(badge.id, [badge])
  }

  return (
    <Box
      as='ul'
      aria-label={ACHIEVEMENTS_STRINGS.groupLabel}
      className='flex min-w-0 flex-wrap gap-1.5'
    >
      {[...groups].map(([key, group]) => {
        const single = group.length === 1 ? group[0] : null

        return (
          <Box as='li' key={key}>
            {single ? (
              <AchievementBadge badge={single} />
            ) : (
              <AchievementStack badges={group} />
            )}
          </Box>
        )
      })}
    </Box>
  )
}
