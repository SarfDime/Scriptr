'use client'

import { COMMENT_STRINGS_PACK } from '@shared/strings/comments-strings'
import type { ResolvedStrings } from '@shared/types/localization.types'
import { portableTextToPlainText } from '@shared/utils/portable-text.utils'
import { Text } from '@/components/typography/Text'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import { validateCommentContent } from '@/lib/comment-validation'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useStrings } from '@/providers/locale/use-strings'
import { CommentEditor } from './CommentEditor'
import { useCommentsServices } from './CommentsProvider'

/** Built in the render, not at module scope: copy read once at import time
 * would keep the first language for the life of the page. */
const composerActionLabels = (
  strings: ResolvedStrings<typeof COMMENT_STRINGS_PACK>
) => ({
  clear: strings.composer.clear,
  preview: strings.composer.showPreview,
  hidePreview: strings.composer.hidePreview,
  cancel: strings.composer.cancel,
  save: strings.composer.submit,
})

/** Editor card for a new top-level comment. Mounted only while composing, so
 * closing it discards the draft by unmounting. */
export function CommentComposer({ onClose }: { onClose: () => void }) {
  const strings = useStrings(COMMENT_STRINGS_PACK)
  const { target, api, addComment } = useCommentsServices()
  const { locale } = useLocale()
  const { run } = useProtectedAction(api.postComment, {
    errorTitle: strings.composer.postError,
  })

  return (
    <CommentEditor
      ariaLabel={strings.composer.editorAriaLabel}
      editorClassName='bg-background-250'
      autoFocus
      actions={['clear', 'preview', 'cancel', 'save']}
      actionLabels={composerActionLabels(strings)}
      confirmCancelWhenDirty
      validate={(value) => validateCommentContent(value, locale)}
      renderMeta={(value) => (
        <Text className='ui-caption'>
          {strings.composer.characterCount(
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
