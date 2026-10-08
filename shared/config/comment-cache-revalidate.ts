import { profileMutationTags } from './cache-tags'
import { COMMENT_CACHE_TAGS } from './comments-cache-tags'

type CommentTagSource = {
  script_id?: string | null
  professor_id?: string | null
  author_id?: string | null
}

/** Builds every cache tag a comment mutation affects. */
export function commentMutationTags(comment: CommentTagSource): Array<string> {
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
