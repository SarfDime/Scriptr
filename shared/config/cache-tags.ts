/** Next.js Data Cache tag names shared between the Hono API and the Next app,
 * so a script mutation on the backend can revalidate the exact frontend fetches it affects.
 */
export const SCRIPT_CACHE_TAGS = {
  list: () => 'scripts:list',
  subject: (subjectId: string) => `scripts:subject:${subjectId}`,
  top: () => 'scripts:top',
  popular: () => 'scripts:popular',
  detail: (scriptId: string) => `scripts:detail:${scriptId}`,
}

/** Public profile pages share one representation tag because a script can
 * appear on both its author's and any number of users' favorites lists. */
export const PROFILE_CACHE_TAGS = {
  public: () => 'profiles:public',
  stats: (profileId: string) => `profiles:stats:${profileId}`,
}

/** Tags to revalidate whenever a script is created, updated, or deleted. */
export function scriptMutationTags(script: {
  id: string
  subject_id: string
  author_id: string
}) {
  return [
    SCRIPT_CACHE_TAGS.list(),
    SCRIPT_CACHE_TAGS.detail(script.id),
    SCRIPT_CACHE_TAGS.subject(script.subject_id),
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
