'use client'

import { getAchievementCopy } from '@shared/config/achievements'
import type { LocaleId } from '@shared/config/localization-constants'
import { ACHIEVEMENTS_STRINGS_PACK } from '@shared/strings/achievements-strings'
import type { ResolvedStrings } from '@shared/types/localization.types'
import type { ProfileAchievement } from '@shared/types/profile.types'
import { formatDayMonthShortYear } from '@shared/utils/date-format.utils'
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
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useStrings } from '@/providers/locale/use-strings'
import { Button } from '../common/Button'
import { Badge } from '../ui/Badge'
import { Divider } from '../ui/Divider'

/** A fixed time zone and the shared name tables, so server and client render
 * the same text and the month name matches the sentence around it. */
const formatEarnedDate = (earnedAt: string, locale: LocaleId) =>
  formatDayMonthShortYear(new Date(earnedAt), locale, 'utc')

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
  /** The study it was earned in; null for a platform-wide achievement. */
  studyName: string | null
}

type AchievementStrings = ResolvedStrings<typeof ACHIEVEMENTS_STRINGS_PACK>

const toBadge = (
  strings: AchievementStrings,
  entry: ProfileAchievement,
  locale: LocaleId
): BadgeModel | null => {
  const { achievement } = entry
  if (!achievement) return null

  const rarity = resolveAchievementRarity(achievement.rarity)
  const copy = getAchievementCopy(entry.achievement_id, achievement, locale)

  return {
    id: entry.achievement_id,
    group: achievement.metric,
    title: copy.title,
    description: copy.description,
    earnedAt: entry.earned_at,
    rarity,
    rarityLabel: strings.rarity[rarity],
    icon: getAchievementIcon(entry.achievement_id, achievement.metric),
    studyName: achievement.study?.name ?? null,
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
  const strings = useStrings(ACHIEVEMENTS_STRINGS_PACK)
  const Icon = badge.icon

  return (
    <Button
      type='button'
      aria-label={
        ariaLabel ?? strings.badgeLabel(badge.title, badge.rarityLabel)
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
const AchievementBadge = ({ badge }: { badge: BadgeModel }) => {
  const { locale } = useLocale()
  const strings = useStrings(ACHIEVEMENTS_STRINGS_PACK)

  return (
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
          {strings.earnedOn(formatEarnedDate(badge.earnedAt, locale))}
        </Text>
        {badge.studyName && (
          <Text className='ui-caption'>
            {strings.earnedIn(badge.studyName)}
          </Text>
        )}
        <Text className='ui-caption ui-cluster gap-1'>
          {strings.rarityLabel}
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
}

/**
 * A type's badges as one tile: the best of them, plus a count. Hovering or
 * focusing the tile opens a tray with the whole type beside it, where every
 * badge shows its own popover.
 */
const AchievementStack = ({ badges }: { badges: Array<BadgeModel> }) => {
  const strings = useStrings(ACHIEVEMENTS_STRINGS_PACK)
  const best = badges[0]
  if (!best) return null
  const rest = badges.slice(1)

  return (
    <Box className='group/stack relative'>
      <BadgeButton
        badge={best}
        ariaLabel={strings.stackLabel(best.title, rest.length)}
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
        {strings.stackCount(rest.length)}
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

/** One scope's badges: stacked by type past four, each on its own tile below
 * that. `label` is the list's accessible name. */
const BadgeList = ({
  badges,
  label,
}: {
  badges: Array<BadgeModel>
  label: string
}) => {
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
    <Box as='ul' aria-label={label} className='flex min-w-0 flex-wrap gap-1.5'>
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

type BadgeScope = {
  key: string
  /** Null when every badge is platform-wide: one unlabelled list reads better
   * than a heading above the only list there is. */
  label: string | null
  badges: Array<BadgeModel>
}

/** Platform-wide achievements first, then one scope per study, each keeping the
 * order `sortAchievements` gave it. */
const groupByScope = (
  strings: AchievementStrings,
  badges: Array<BadgeModel>
): Array<BadgeScope> => {
  const byStudy = new Map<string, Array<BadgeModel>>()
  const global: Array<BadgeModel> = []
  for (const badge of badges) {
    if (!badge.studyName) {
      global.push(badge)
      continue
    }
    const group = byStudy.get(badge.studyName) ?? []
    group.push(badge)
    byStudy.set(badge.studyName, group)
  }

  const onlyGlobal = byStudy.size === 0
  const scopes: Array<BadgeScope> = []
  if (global.length > 0) {
    scopes.push({
      key: 'global',
      label: onlyGlobal ? null : strings.scopeGlobal,
      badges: global,
    })
  }
  for (const [studyName, studyBadges] of [...byStudy].sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    scopes.push({
      key: `study:${studyName}`,
      label: studyName,
      badges: studyBadges,
    })
  }
  return scopes
}

/**
 * A profile's earned achievements, as badges with a hover/focus popover.
 * Renders nothing when there are none. Callers pass them already ordered (see
 * `sortAchievements`), so the first badge of a type is its rarest. A client
 * leaf only because the popover tracks hover and focus.
 *
 * Achievements are earned either platform-wide or inside one study, and the two
 * are shown apart — a study's badge is not the platform's, and a reader should
 * be able to tell which is which without opening every popover.
 */
export const AchievementBadges = ({
  achievements,
}: {
  achievements: Array<ProfileAchievement>
}) => {
  // Re-sorted here as well as by the caller so a stack is led by the rarest
  // badge of its type — the placeholders are appended, not ordered — and the
  // tile that stays visible is the most valuable one.
  const strings = useStrings(ACHIEVEMENTS_STRINGS_PACK)
  const { locale } = useLocale()
  const badges = sortAchievements(achievements)
    .map((entry) => toBadge(strings, entry, locale))
    .filter((badge): badge is BadgeModel => badge !== null)

  if (badges.length === 0) return null

  const scopes = groupByScope(strings, badges)
  const single = scopes.length === 1 ? scopes[0] : null

  if (single?.label === null) {
    return <BadgeList badges={single.badges} label={strings.groupLabel} />
  }

  return (
    <Box className='ui-stack gap-2'>
      {scopes.map((scope) => (
        <Box key={scope.key} className='ui-stack gap-1'>
          <BadgeList
            badges={scope.badges}
            label={`${strings.groupLabel} — ${scope.label}`}
          />
        </Box>
      ))}
    </Box>
  )
}
