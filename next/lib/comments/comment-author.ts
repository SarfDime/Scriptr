import type { COMMENT_STRINGS_PACK } from '@shared/strings/comments-strings'
import type { ResolvedStrings } from '@shared/types/localization.types'
import type { CommentEntity } from '@/types/components/comments/Comments.types'

type CommentAuthor = CommentEntity['author']

export const getAuthorDisplayName = (
  author: CommentAuthor,
  strings: ResolvedStrings<typeof COMMENT_STRINGS_PACK>
): string => {
  if (!author) return strings.general.deletedUser
  return author.full_name ?? author.username ?? strings.general.unknownAuthor
}

/** `null` for deleted authors and authors without a username — nothing to link to. */
export const getAuthorProfileHref = (author: CommentAuthor): string | null =>
  author?.username ? `/user/${encodeURIComponent(author.username)}` : null
