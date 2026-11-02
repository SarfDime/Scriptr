'use client'

import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import { validateCommentContent } from '@/lib/comment-validation'
import { CommentEditor } from './CommentEditor'
import { useCommentsServices } from './CommentsProvider'

const REPLY_ACTION_LABELS = {
  cancel: COMMENT_STRINGS.reply.cancel,
  save: COMMENT_STRINGS.reply.submit,
}

/** Inline editor for replying to one comment. Mounted only while open, so
 * closing it discards the draft by unmounting. */
export function CommentReplyBox({
  parentId,
  onClose,
}: {
  parentId: string
  onClose: () => void
}) {
  const { api, addReply } = useCommentsServices()
  const { run } = useProtectedAction(api.postReply, {
    errorTitle: COMMENT_STRINGS.reply.postError,
  })

  return (
    <CommentEditor
      ariaLabel={COMMENT_STRINGS.reply.editorAriaLabel}
      editorClassName='min-h-24'
      autoFocus
      actions={['cancel', 'save']}
      actionLabels={REPLY_ACTION_LABELS}
      confirmCancelWhenDirty
      validate={validateCommentContent}
      onSave={async (value) => {
        const result = await run(parentId, value)
        if (result.ok) addReply(parentId, result.data.reply)
        return result.ok
      }}
      onSaveSuccess={onClose}
      onCancel={onClose}
    />
  )
}
