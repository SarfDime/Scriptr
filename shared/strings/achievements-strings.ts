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
  earnedOn: (date: string) => `Earned on ${date}` as const,
  rarityLabel: `Rarity: ` as const,
} as const
