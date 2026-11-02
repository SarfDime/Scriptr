/**
 * Achievement metrics, rarity tiers and display copy shared by the API and the
 * frontend.
 *
 * Metrics are code-bound (each one has a calculator in
 * hono/src/lib/achievements.ts that queries a different table), so this list
 * has to be extended by hand when a metric is added — unlike achievement
 * *definitions*, which are a plain data insert (see ARCHITECTURE.md §4).
 *
 * Rarities are ordered: index 0 is the lowest tier. The DB CHECK on
 * `achievement_definitions.rarity` guards the same set of values.
 */
export const ACHIEVEMENT_METRICS = [
  'scripts_uploaded',
  'comments_posted',
  'total_script_votes',
  'total_script_downloads',
] as const

export const ACHIEVEMENT_RARITIES = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
] as const

export type AchievementMetric = (typeof ACHIEVEMENT_METRICS)[number]
export type AchievementRarity = (typeof ACHIEVEMENT_RARITIES)[number]

export const isAchievementMetric = (
  value: string
): value is AchievementMetric =>
  (ACHIEVEMENT_METRICS as ReadonlyArray<string>).includes(value)

export const isAchievementRarity = (
  value: string
): value is AchievementRarity =>
  (ACHIEVEMENT_RARITIES as ReadonlyArray<string>).includes(value)

/**
 * Display copy for the seeded achievements, keyed by `achievement_definitions.id`.
 *
 * Titles and descriptions live here rather than in the database so a wording
 * change is a reviewed code change with no migration and no admin step, and so
 * the badge, the admin list and the notification all read the same sentence.
 * Metric, threshold and rarity stay in the database: the award helper and the
 * admin editor both need them as data.
 *
 * Definitions created later through the admin screen have no entry here and
 * fall back to the row they were saved with — see `getAchievementCopy`.
 */
export const ACHIEVEMENT_COPY: Record<
  string,
  { title: string; description: string }
> = {
  // scripts_uploaded
  first_upload: {
    title: 'Fresh Off the Press',
    description:
      'Your first script is out in the wild. Somebody is about to study from it.',
  },
  script_stack: {
    title: 'Starter Stack',
    description: 'Three scripts in. The collection has officially begun.',
  },
  prolific_uploader: {
    title: 'Script Hoarder',
    description: 'Ten scripts shared. Your folder is turning into a library.',
  },
  syllabus_keeper: {
    title: 'Syllabus Keeper',
    description:
      'Twenty-five scripts shared — the whole semester is archived for the next generation.',
  },
  library_of_scriptr: {
    title: 'Library of Scriptr',
    description:
      'Fifty scripts shared. You are essentially the faculty archive now.',
  },
  // comments_posted
  first_word: {
    title: 'First Word',
    description: 'You broke the silence with a comment.',
  },
  study_buddy: {
    title: 'Study Buddy',
    description:
      "Ten comments. Somebody's question got answered because of you.",
  },
  active_commenter: {
    title: 'Thread Goblin',
    description:
      'Twenty-five comments. You basically live in the discussion at this point.',
  },
  seminar_speaker: {
    title: 'Seminar Speaker',
    description: 'A hundred comments. The discussion tends to start with you.',
  },
  voice_of_the_faculty: {
    title: 'Voice of the Faculty',
    description:
      'Two hundred and fifty comments. Yours is the answer everyone waits for.',
  },
  // total_script_votes
  seal_of_approval: {
    title: 'Seal of Approval',
    description:
      "Your first upvote landed. Validation tastes good, doesn't it?",
  },
  crowd_pleaser: {
    title: 'Crowd Pleaser',
    description:
      'Ten votes across your scripts. The crowd is paying attention.',
  },
  popular_creator: {
    title: 'Vote Magnet',
    description:
      'Fifty votes across your scripts. People go looking for your notes now.',
  },
  campus_legend: {
    title: 'Campus Legend',
    description:
      'Two hundred and fifty votes. Your scripts are basically folklore now.',
  },
  script_royalty: {
    title: 'Script Royalty',
    description:
      'A thousand votes across your scripts. They have their own fan club at this point.',
  },
  // total_script_downloads
  someone_noticed: {
    title: 'Someone Noticed',
    description: 'Your script was downloaded for the first time.',
  },
  in_demand: {
    title: 'In Demand',
    description: 'Ten downloads. Study groups are passing your notes around.',
  },
  exam_season_hero: {
    title: 'Exam Season Hero',
    description: "A hundred downloads — you are somebody's last-minute rescue.",
  },
  viral_syllabus: {
    title: 'Viral Syllabus',
    description: 'Five hundred downloads. Half the faculty has a copy by now.',
  },
  greatest_hits: {
    title: 'Greatest Hits',
    description:
      'Two thousand downloads. Somewhere, a printing press is jealous.',
  },
}

/** Copy stored on the definition row, used when the id has no code entry. */
type StoredAchievementCopy = {
  title?: string | null
  description?: string | null
}

/**
 * The copy to show for an achievement: the catalogue entry when there is one,
 * otherwise whatever the row was saved with. `id` itself is the last resort so
 * an unknown achievement still renders something readable.
 */
export const getAchievementCopy = (
  id: string,
  stored?: StoredAchievementCopy | null
): { title: string; description: string | null } =>
  ACHIEVEMENT_COPY[id] ?? {
    title: stored?.title ?? id,
    description: stored?.description ?? null,
  }
