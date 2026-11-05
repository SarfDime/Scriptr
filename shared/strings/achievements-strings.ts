import type { AchievementRarity } from '../config/achievements'

export const ACHIEVEMENTS_STRINGS = {
  groupLabel: 'Achievements',
  rarity: {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
  } as const satisfies Record<AchievementRarity, string>,
  badgeLabel: (title: string, rarityLabel: string) =>
    `${title}, ${rarityLabel} achievement` as const,
  /** The count on a stacked badge; the rest of the type is in its tray. */
  stackCount: (hidden: number) => `+${hidden}` as const,
  stackLabel: (title: string, hidden: number) =>
    `${title}, ${hidden} more like it` as const,
  earnedOn: (date: string) => `Earned on ${date}` as const,
  rarityLabel: `Rarity: ` as const,
} as const
