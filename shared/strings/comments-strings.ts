/** Every user-facing string in the comments UI. Entries that depend on a value
 * (counts, names, labels) are small functions so wording and pluralisation
 * stay here instead of leaking into components. */
export const COMMENT_STRINGS = {
  general: {
    title: 'Comments',
    commentNoun: 'comment',
    emptyState: 'No comments yet — be the first to say something.',
    deletedUser: 'Deleted user',
    unknownAuthor: 'N/A',
    tryAgain: 'Please try again.',
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
  },
  reactions: {
    reactWith: (label: string) => `React with ${label}`,
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
} as const
