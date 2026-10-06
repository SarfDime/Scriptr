import type { CommentEntity } from '@/types/components/comments/Comments.types'

/** Turns the API's flat list into a tree, replies sorted oldest-first. */
export const nestCommentReplies = (
  comments: Array<CommentEntity>
): Array<CommentEntity> => {
  const commentsById = new Map<string, CommentEntity>(
    comments.map((comment): [string, CommentEntity] => [
      comment.id,
      { ...comment, replies: [] },
    ])
  )
  const rootComments: Array<CommentEntity> = []

  for (const comment of comments) {
    const nestedComment = commentsById.get(comment.id)
    if (!nestedComment) continue

    if (comment.parent_id) {
      const parent = commentsById.get(comment.parent_id)
      if (parent) {
        parent.replies?.push(nestedComment)
        continue
      }
    }

    rootComments.push(nestedComment)
  }

  const sortReplies = (comment: CommentEntity) => {
    comment.replies?.sort(
      (left, right) =>
        new Date(left.created_at).getTime() -
        new Date(right.created_at).getTime()
    )
    comment.replies?.forEach(sortReplies)
  }

  rootComments.forEach(sortReplies)
  return rootComments
}

export const addReply = (
  comments: Array<CommentEntity>,
  parentId: string,
  reply: CommentEntity
): Array<CommentEntity> =>
  comments.map((comment) =>
    comment.id === parentId
      ? { ...comment, replies: [...(comment.replies ?? []), reply] }
      : {
          ...comment,
          replies: comment.replies
            ? addReply(comment.replies, parentId, reply)
            : undefined,
        }
  )

export const removeComment = (
  comments: Array<CommentEntity>,
  commentId: string
): Array<CommentEntity> =>
  comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: comment.replies
        ? removeComment(comment.replies, commentId)
        : undefined,
    }))

export const countComments = (comments: Array<CommentEntity>): number =>
  comments.reduce(
    (total, comment) => total + 1 + countComments(comment.replies ?? []),
    0
  )
