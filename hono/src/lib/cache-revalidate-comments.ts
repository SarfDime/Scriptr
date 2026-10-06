import { profileMutationTags } from '../../../shared/config/cache-tags'
import { COMMENT_CACHE_TAGS } from '../../../shared/config/comments-cache-tags'
import { revalidateCacheTags } from './cache-revalidate'

type CommentTagSource = {
  script_id?: string | null
  professor_id?: string | null
  author_id?: string | null
}

/**
 * Re-exported under a comment-specific name so call sites in comments.ts
 * clearly communicate the mutation that triggers the revalidation.
 */
export const revalidateCommentTags = revalidateCacheTags

/**
 * Builds every cache tag a comment mutation affects. A comment always has
 * exactly one of script_id/professor_id (enforced at the route). Its author
 * also contributes to public profile activity, so invalidate that profile's
 * stats and the shared public-profile representation.
 */
export function commentMutationTags(comment: CommentTagSource) {
  const tags: Array<string> = []
  if (comment.script_id) tags.push(COMMENT_CACHE_TAGS.script(comment.script_id))
  if (comment.professor_id) {
    tags.push(COMMENT_CACHE_TAGS.professor(comment.professor_id))
  }
  if (comment.author_id) {
    tags.push(
      COMMENT_CACHE_TAGS.user(comment.author_id),
      ...profileMutationTags(comment.author_id)
    )
  }
  return tags
}
