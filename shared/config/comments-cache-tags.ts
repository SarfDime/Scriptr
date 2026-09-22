/**
 * Mirrors SCRIPT_CACHE_TAGS' shape (per next/lib/scripts-api.ts) for comment
 * reads. Kept in its own file rather than edited into the real
 * shared/config/cache-tags.ts, since that file's current contents weren't
 * available here and guessing its other exports risked clobbering them —
 * fold this into that file directly once you're working in the real repo,
 * it doesn't need to stay separate.
 */
export const COMMENT_CACHE_TAGS = {
  script: (scriptId: string) => `comments:script:${scriptId}` as const,
  professor: (professorId: string) =>
    `comments:professor:${professorId}` as const,
  user: (userId: string) => `comments:user:${userId}` as const,
}
