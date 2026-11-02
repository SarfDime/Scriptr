import AddComment from '@sanity/icons/AddComment'
import Archive from '@sanity/icons/Archive'
import Book from '@sanity/icons/Book'
import Comment from '@sanity/icons/Comment'
import Confetti from '@sanity/icons/Confetti'
import Diamond from '@sanity/icons/Diamond'
import Documents from '@sanity/icons/Documents'
import DocumentText from '@sanity/icons/DocumentText'
import DoubleQuote from '@sanity/icons/DoubleQuote'
import Download from '@sanity/icons/Download'
import EarthGlobe from '@sanity/icons/EarthGlobe'
import Feedback from '@sanity/icons/Feedback'
import Heart from '@sanity/icons/Heart'
import Microphone from '@sanity/icons/Microphone'
import Package from '@sanity/icons/Package'
import Rocket from '@sanity/icons/Rocket'
import Star from '@sanity/icons/Star'
import ThumbsUp from '@sanity/icons/ThumbsUp'
import TrendUpward from '@sanity/icons/TrendUpward'
import Upload from '@sanity/icons/Upload'
import {
  ACHIEVEMENT_RARITIES,
  type AchievementMetric,
  type AchievementRarity,
  isAchievementMetric,
  isAchievementRarity,
} from '@shared/config/achievements'
import type { ProfileAchievement } from '@shared/types/profile.types'
import type { ComponentType } from 'react'
import { Trophy } from '@/components/ui/icons/TrophyIcon'
import type { ComponentColorPalettes } from '@/types/components/ColorPalettes.types'

type AchievementIcon = ComponentType<{ className?: string }>

/**
 * One palette per rarity tier. `cp-brand` is deliberately not used: it is azure
 * in light mode (collides with `cp-blue`) and mint in dark mode (collides with
 * `cp-green`), so epic uses `cp-rose` instead. The Record is exhaustive, so a
 * new rarity fails type-check until it gets a palette.
 */
export const ACHIEVEMENT_RARITY_PALETTES: Record<
  AchievementRarity,
  ComponentColorPalettes
> = {
  common: 'cp-gray',
  uncommon: 'cp-green',
  rare: 'cp-blue',
  epic: 'cp-rose',
  legendary: 'cp-amber',
}

/** One icon family per metric, so achievements of the same type look alike. */
export const ACHIEVEMENT_METRIC_ICONS: Record<
  AchievementMetric,
  AchievementIcon
> = {
  scripts_uploaded: DocumentText,
  comments_posted: Comment,
  total_script_votes: Heart,
  total_script_downloads: Download,
}

/**
 * Per-achievement icons, keyed by achievement id, picked from the metric's
 * family. Definitions created later fall back to their metric icon.
 */
export const ACHIEVEMENT_ICON_OVERRIDES: Partial<
  Record<string, AchievementIcon>
> = {
  // scripts_uploaded — file and collection imagery, one per tier
  first_upload: Upload,
  script_stack: Package,
  prolific_uploader: Documents,
  syllabus_keeper: Book,
  library_of_scriptr: Archive,
  // comments_posted — discussion imagery
  first_word: AddComment,
  study_buddy: Feedback,
  active_commenter: Comment,
  seminar_speaker: Microphone,
  voice_of_the_faculty: DoubleQuote,
  // total_script_votes — approval imagery
  seal_of_approval: ThumbsUp,
  crowd_pleaser: Heart,
  popular_creator: Star,
  campus_legend: Trophy,
  script_royalty: Diamond,
  // total_script_downloads — reach imagery
  someone_noticed: Download,
  in_demand: TrendUpward,
  exam_season_hero: Rocket,
  viral_syllabus: EarthGlobe,
  greatest_hits: Confetti,
}

const GENERIC_ACHIEVEMENT_ICON: AchievementIcon = Trophy

export const getAchievementIcon = (
  achievementId: string,
  metric: string
): AchievementIcon =>
  ACHIEVEMENT_ICON_OVERRIDES[achievementId] ??
  (isAchievementMetric(metric)
    ? ACHIEVEMENT_METRIC_ICONS[metric]
    : GENERIC_ACHIEVEMENT_ICON)

/** The payload carries rarity as plain text; an unknown value reads as common. */
export const resolveAchievementRarity = (rarity: string): AchievementRarity =>
  isAchievementRarity(rarity) ? rarity : 'common'

/**
 * Drops rows without a definition, then orders by rarity (legendary first) and
 * newest earned first within a tier.
 */
export const sortAchievements = (
  achievements: Array<ProfileAchievement>
): Array<ProfileAchievement> =>
  achievements
    .filter((entry) => entry.achievement !== null)
    .sort((a, b) => {
      const rarityDifference =
        ACHIEVEMENT_RARITIES.indexOf(
          resolveAchievementRarity(b.achievement?.rarity ?? '')
        ) -
        ACHIEVEMENT_RARITIES.indexOf(
          resolveAchievementRarity(a.achievement?.rarity ?? '')
        )
      return (
        rarityDifference || Date.parse(b.earned_at) - Date.parse(a.earned_at)
      )
    })
