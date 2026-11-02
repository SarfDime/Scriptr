'use client'

import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import { validateCommentContent } from '@/lib/comment-validation'
import type { CommentEntity } from '@/types/components/comments/Comments.types'
import { CommentEditor } from './CommentEditor'
import { useCommentsServices } from './CommentsProvider'

const EDIT_ACTION_LABELS = {
  cancel: COMMENT_STRINGS.reply.cancel,
  save: COMMENT_STRINGS.composer.saveEdit,
}

export function CommentEditBox({
  comment,
  onClose,
}: {
  comment: CommentEntity
  onClose: () => void
}) {
  const { api, updateComment } = useCommentsServices()
  const { run } = useProtectedAction(api.patchComment, {
    errorTitle: COMMENT_STRINGS.composer.editError,
  })

  return (
    <CommentEditor
      initialContent={comment.content}
      ariaLabel={COMMENT_STRINGS.composer.editorAriaLabel}
      editorClassName='min-h-24'
      autoFocus
      actions={['cancel', 'save']}
      actionLabels={EDIT_ACTION_LABELS}
      validate={validateCommentContent}
      onSave={async (value) => {
        const result = await run(comment.id, value)
        if (result.ok) updateComment(result.data.comment)
        return result.ok
      }}
      onSaveSuccess={onClose}
      onCancel={onClose}
    />
  )
}
