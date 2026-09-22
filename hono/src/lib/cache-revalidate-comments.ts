import { COMMENT_CACHE_TAGS } from '../../../shared/config/comments-cache-tags'
import { revalidateScriptTags } from './cache-revalidate'

type CommentTagSource = {
  script_id?: string | null
  professor_id?: string | null
  author_id?: string | null
}

/**
 * ASSUMPTION: `revalidateScriptTags` (./cache-revalidate) wasn't available to
 * inspect in this session, but its call sites in scripts.ts only ever pass it
 * `(c.env, tagsArray)` — nothing script-specific in the call shape. Reused
 * directly here rather than duplicating whatever fetch/secret logic lives
 * inside it, and re-exported under a comment-specific name so call sites in
 * comments.ts read correctly. If that function turns out to contain
 * script-only logic after all, split this into its own implementation
 * instead of aliasing it.
 */
export const revalidateCommentTags = revalidateScriptTags

/**
 * Builds every cache tag a comment mutation affects. A comment always has
 * exactly one of script_id/professor_id (enforced at the route), and always
 * has an author_id, so at most two tags come back.
 */
export function commentMutationTags(comment: CommentTagSource) {
  const tags: Array<string> = []
  if (comment.script_id) tags.push(COMMENT_CACHE_TAGS.script(comment.script_id))
  if (comment.professor_id) {
    tags.push(COMMENT_CACHE_TAGS.professor(comment.professor_id))
  }
  if (comment.author_id) tags.push(COMMENT_CACHE_TAGS.user(comment.author_id))
  return tags
}
