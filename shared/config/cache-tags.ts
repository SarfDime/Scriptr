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

/** Tags to revalidate whenever a script is created, updated, or deleted. */
export function scriptMutationTags(script: { id: string; subject_id: string }) {
  return [
    SCRIPT_CACHE_TAGS.list(),
    SCRIPT_CACHE_TAGS.detail(script.id),
    SCRIPT_CACHE_TAGS.subject(script.subject_id),
    SCRIPT_CACHE_TAGS.top(),
    SCRIPT_CACHE_TAGS.popular(),
  ]
}
