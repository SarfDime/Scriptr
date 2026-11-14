'use client'

import { COMMENT_STRINGS_PACK } from '@shared/strings/comments-strings'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import { validateCommentContent } from '@/lib/comment-validation'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useStrings } from '@/providers/locale/use-strings'
import type { CommentEntity } from '@/types/components/comments/Comments.types'
import { CommentEditor } from './CommentEditor'
import { useCommentsServices } from './CommentsProvider'

export function CommentEditBox({
  comment,
  onClose,
}: {
  comment: CommentEntity
  onClose: () => void
}) {
  const strings = useStrings(COMMENT_STRINGS_PACK)
  const { api, updateComment } = useCommentsServices()
  const { locale } = useLocale()
  const { run } = useProtectedAction(api.patchComment, {
    errorTitle: strings.composer.editError,
  })

  return (
    <CommentEditor
      initialContent={comment.content}
      ariaLabel={strings.composer.editorAriaLabel}
      editorClassName='min-h-24'
      autoFocus
      actions={['cancel', 'save']}
      actionLabels={{
        cancel: strings.reply.cancel,
        save: strings.composer.saveEdit,
      }}
      validate={(value) => validateCommentContent(value, locale)}
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
