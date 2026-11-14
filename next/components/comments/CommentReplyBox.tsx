'use client'

import { COMMENT_STRINGS_PACK } from '@shared/strings/comments-strings'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import { validateCommentContent } from '@/lib/comment-validation'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useStrings } from '@/providers/locale/use-strings'
import { CommentEditor } from './CommentEditor'
import { useCommentsServices } from './CommentsProvider'

/** Inline editor for replying to one comment. Mounted only while open, so
 * closing it discards the draft by unmounting. */
export function CommentReplyBox({
  parentId,
  onClose,
}: {
  parentId: string
  onClose: () => void
}) {
  const strings = useStrings(COMMENT_STRINGS_PACK)
  const { api, addReply } = useCommentsServices()
  const { locale } = useLocale()
  const { run } = useProtectedAction(api.postReply, {
    errorTitle: strings.reply.postError,
  })

  return (
    <CommentEditor
      ariaLabel={strings.reply.editorAriaLabel}
      editorClassName='min-h-24'
      autoFocus
      actions={['cancel', 'save']}
      actionLabels={{
        cancel: strings.reply.cancel,
        save: strings.reply.submit,
      }}
      confirmCancelWhenDirty
      validate={(value) => validateCommentContent(value, locale)}
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
