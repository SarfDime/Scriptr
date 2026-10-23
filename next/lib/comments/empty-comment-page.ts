import type { CommentPage } from '@shared/types/comments.types'

/** A comment page with nothing in it. Typed `CommentPage<never>` so it fits
 * any `CommentPage<T>` slot. Used where a failed first read still has to hand
 * the comment section something to render alongside `initialLoadFailed`. */
export const EMPTY_COMMENT_PAGE: CommentPage<never> = {
  items: [],
  hasMore: false,
  totalCount: 0,
  totalCommentCount: 0,
}
