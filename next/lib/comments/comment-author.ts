import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import type { CommentEntity } from '@/types/components/comments/Comments.types'

type CommentAuthor = CommentEntity['author']

export const getAuthorDisplayName = (author: CommentAuthor): string => {
  if (!author) return COMMENT_STRINGS.general.deletedUser
  return (
    author.full_name ?? author.username ?? COMMENT_STRINGS.general.unknownAuthor
  )
}

/** `null` for deleted authors and authors without a username — nothing to link to. */
export const getAuthorProfileHref = (author: CommentAuthor): string | null =>
  author?.username ? `/user/${encodeURIComponent(author.username)}` : null
