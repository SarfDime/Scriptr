/** Cache tags for public comment reads, invalidated after comment mutations. */
export const COMMENT_CACHE_TAGS = {
  script: (scriptId: string) => `comments:script:${scriptId}` as const,
  professor: (professorId: string) =>
    `comments:professor:${professorId}` as const,
  user: (userId: string) => `comments:user:${userId}` as const,
}
