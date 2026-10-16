/** Every user-facing string in the comments UI. Entries that depend on a value
 * (counts, names, labels) are small functions so wording and pluralisation
 * stay here instead of leaking into components. */
import { PORTABLE_TEXT_LIMITS } from '../config/portable-text-limits'

export const COMMENT_STRINGS = {
  general: {
    title: 'Comments',
    newest: 'Newest',
    top: 'Top',
    sortComments: 'Sort comments',
    showMoreComments: 'Show more comments',
    showMoreReplies: 'Show more replies',
    showReplies: 'Show replies',
    hideReplies: 'Hide replies',
    loadingComments: 'Loading comments…',
    loadingReplies: 'Loading replies…',
    commentNoun: 'comment',
    emptyState: 'No comments yet — be the first to say something.',
    deletedUser: 'Deleted user',
    unknownAuthor: 'N/A',
    tryAgain: 'Please try again.',
    loadingEditor: 'Loading comment editor…',
    loadCommentsError: 'Could not load comments.',
    loadMoreCommentsError: 'Could not load more comments.',
    loadRepliesError: 'Could not load replies.',
    minimumLength: () =>
      `Enter at least ${PORTABLE_TEXT_LIMITS.commentMinimumCharacters} characters to post.`,
    edited: 'Edited',
  },
  composer: {
    openButton: 'Write a comment',
    editorAriaLabel: 'Write a comment',
    previewLabel: 'Preview',
    showPreview: 'Preview',
    hidePreview: 'Hide preview',
    clear: 'Clear',
    cancel: 'Cancel',
    submit: 'Post comment',
    postError: 'Couldn’t post comment',
    characterCount: (count: number) =>
      `${count} ${count === 1 ? 'character' : 'characters'}`,
    saveEdit: 'Save changes',
    editError: 'Couldn’t edit comment',
  },
  reply: {
    action: 'Reply',
    editorAriaLabel: 'Write a reply',
    cancel: 'Cancel',
    submit: 'Post reply',
    postError: 'Couldn’t post reply',
    replyingTo: (name: string) => `· replying to ${name}`,
  },
  actions: {
    like: 'Like',
    report: 'Report',
    delete: 'Delete',
    edit: 'Edit',
  },
  reactions: {
    reactWith: (label: string, count: number) =>
      `React with ${label} (${count})`,
    labels: {
      like: 'Like',
      hate: 'Dislike',
      funny: 'Funny',
      sad: 'Sad',
      confused: 'Confused',
    },
    showAll: 'Add reaction',
    hideAll: 'Hide reactions',
    updateError: 'Couldn’t update reaction',
  },
  deletion: {
    confirmTitle: 'Delete this comment?',
    confirmDescription: 'This permanently deletes the comment and its replies.',
    confirmLabel: 'Delete',
    error: 'Couldn’t delete comment',
  },
  moderation: {
    discardTitle: 'Discard this draft?',
    discardDescription: 'Your comment draft will be lost.',
    discardConfirm: 'Discard draft',
  },
  validation: {
    minimumLength: (minimum: number) =>
      `Comment must be at least ${minimum} characters long and cannot contain headings, lists, or text alignment`,
    replyMinimumLength: (minimum: number) =>
      `Reply must be at least ${minimum} characters long and cannot contain headings, lists, or text alignment`,
    maximumSize: (maximumBytes: number) =>
      `Comment content must be no larger than ${maximumBytes} bytes`,
  },
} as const
