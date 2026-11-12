/** Next.js Data Cache tag names shared between the Hono API and the Next app,
 * so a script mutation on the backend can revalidate the exact frontend fetches it affects.
 */
export const SCRIPT_CACHE_TAGS = {
  list: () => 'scripts:list',
  subject: (subjectId: string) => `scripts:subject:${subjectId}`,
  /** One study's own feeds. Kept apart from `list` so a publish in one study
   * does not flush every other study's pages. */
  study: (studyId: string) => `scripts:study:${studyId}`,
  top: () => 'scripts:top',
  popular: () => 'scripts:popular',
  detail: (scriptId: string) => `scripts:detail:${scriptId}`,
}

/** Sanity dataset reads. Each query is tagged with the document types it
 * renders, so a publish invalidates the pages that read that type instead of
 * the whole dataset. `all` stays on every read as the manual purge switch. */
export const SANITY_CACHE_TAGS = {
  all: 'sanity',
  website: 'sanity:website',
  navigation: 'sanity:navigation',
  university: 'sanity:university',
  faculty: 'sanity:faculty',
  study: 'sanity:study',
  subject: 'sanity:subject',
  professor: 'sanity:professor',
  person: 'sanity:person',
  calendar: 'sanity:calendar',
  studyTip: 'sanity:study-tip',
} as const

/** Sanity document type to the cache tag its reads carry. Types that only
 * exist as objects (portable text, localized primitives, buttons) are set on
 * the document that owns them, so they need no entry. */
export const SANITY_TYPE_TAGS: Record<string, string> = {
  website: SANITY_CACHE_TAGS.website,
  starCanvas: SANITY_CACHE_TAGS.website,
  navMenu: SANITY_CACHE_TAGS.navigation,
  navItem: SANITY_CACHE_TAGS.navigation,
  subMenuItem: SANITY_CACHE_TAGS.navigation,
  university: SANITY_CACHE_TAGS.university,
  faculty: SANITY_CACHE_TAGS.faculty,
  study: SANITY_CACHE_TAGS.study,
  subject: SANITY_CACHE_TAGS.subject,
  professor: SANITY_CACHE_TAGS.professor,
  person: SANITY_CACHE_TAGS.person,
  calendar: SANITY_CACHE_TAGS.calendar,
  calendarEvent: SANITY_CACHE_TAGS.calendar,
  studyTip: SANITY_CACHE_TAGS.studyTip,
}

/** Public profile pages share one representation tag because a script can
 * appear on both its author's and any number of users' favorites lists. */
export const PROFILE_CACHE_TAGS = {
  public: () => 'profiles:public',
  stats: (profileId: string) => `profiles:stats:${profileId}`,
}

/** Public rating reads: the admin-managed criteria, and the averages and
 * counts for one professor or subject. */
export const RATING_CACHE_TAGS = {
  types: () => 'ratings:types',
  professor: (professorId: string) => `ratings:professor:${professorId}`,
  subject: (subjectId: string) => `ratings:subject:${subjectId}`,
}

/** Tags to revalidate whenever a script is created, updated, or deleted.
 * The detail read is cached under whichever identifier its URL used, and every
 * public link uses the slug, so both keys are expired: tagging only the id left
 * the slug entry — the one readers actually hit — stale indefinitely, because
 * the Data Cache outlives a deploy and nothing else ever clears that key.
 * `study_id` is optional because a few call sites only carry the fields they
 * need; when it is present, the script's own study feed is invalidated too. */
export function scriptMutationTags(script: {
  id: string
  slug: string
  subject_id: string
  author_id: string
  study_id?: string | null
}) {
  return [
    SCRIPT_CACHE_TAGS.list(),
    SCRIPT_CACHE_TAGS.detail(script.id),
    SCRIPT_CACHE_TAGS.detail(script.slug),
    SCRIPT_CACHE_TAGS.subject(script.subject_id),
    ...(script.study_id ? [SCRIPT_CACHE_TAGS.study(script.study_id)] : []),
    SCRIPT_CACHE_TAGS.top(),
    SCRIPT_CACHE_TAGS.popular(),
    PROFILE_CACHE_TAGS.public(),
    PROFILE_CACHE_TAGS.stats(script.author_id),
  ]
}

/** Tags to revalidate when a public profile or its selections change. */
export function profileMutationTags(profileId: string) {
  return [PROFILE_CACHE_TAGS.public(), PROFILE_CACHE_TAGS.stats(profileId)]
}
