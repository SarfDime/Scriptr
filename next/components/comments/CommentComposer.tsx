'use client'

import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import { portableTextToPlainText } from '@shared/utils/portable-text.utils'
import { Text } from '@/components/typography/Text'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import { validateCommentContent } from '@/lib/comment-validation'
import { CommentEditor } from './CommentEditor'
import { useCommentsServices } from './CommentsProvider'

const COMPOSER_ACTION_LABELS = {
  clear: COMMENT_STRINGS.composer.clear,
  preview: COMMENT_STRINGS.composer.showPreview,
  hidePreview: COMMENT_STRINGS.composer.hidePreview,
  cancel: COMMENT_STRINGS.composer.cancel,
  save: COMMENT_STRINGS.composer.submit,
}

/** Editor card for a new top-level comment. Mounted only while composing, so
 * closing it discards the draft by unmounting. */
export function CommentComposer({ onClose }: { onClose: () => void }) {
  const { target, api, addComment } = useCommentsServices()
  const { run } = useProtectedAction(api.postComment, {
    errorTitle: COMMENT_STRINGS.composer.postError,
  })

  return (
    <CommentEditor
      ariaLabel={COMMENT_STRINGS.composer.editorAriaLabel}
      editorClassName='bg-background-250'
      autoFocus
      actions={['clear', 'preview', 'cancel', 'save']}
      actionLabels={COMPOSER_ACTION_LABELS}
      confirmCancelWhenDirty
      validate={validateCommentContent}
      renderMeta={(value) => (
        <Text className='ui-caption'>
          {COMMENT_STRINGS.composer.characterCount(
            portableTextToPlainText(value).trim().length
          )}
        </Text>
      )}
      onSave={async (value) => {
        const result = await run(target, value)
        if (result.ok) addComment(result.data.comment)
        return result.ok
      }}
      onSaveSuccess={onClose}
      onCancel={onClose}
    />
  )
}
