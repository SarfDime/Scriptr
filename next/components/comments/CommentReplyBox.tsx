'use client'

import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import { useRichTextDraft } from '@/hooks/useRichTextDraft'
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
  const { target, api, addReply } = useCommentsServices()
  const draft = useRichTextDraft()
  const { state, run } = useProtectedAction(api.postReply, {
    errorTitle: COMMENT_STRINGS.reply.postError,
  })

  const handleSubmit = async () => {
    if (!draft.content || !draft.isValid) return
    const result = await run(parentId, target, draft.content)
    if (result.ok) {
      addReply(parentId, result.data.reply)
      onClose()
    }
  }

  return (
    <Box className='ui-stack gap-2'>
      <CommentEditor
        key={draft.editorKey}
        onChange={draft.setContent}
        ariaLabel={COMMENT_STRINGS.reply.editorAriaLabel}
        className='min-h-24'
      />
      {draft.hasContent && !draft.hasMinimumLength && (
        <Text role='alert' className='ui-caption text-red-600'>
          {COMMENT_STRINGS.general.minimumLength}
        </Text>
      )}
      <Box className='ui-cluster justify-end gap-2'>
        <Button onClick={onClose} className='button subtle'>
          {COMMENT_STRINGS.reply.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!draft.isValid || state.status === 'pending'}
          className='button solid'
        >
          {COMMENT_STRINGS.reply.submit}
        </Button>
      </Box>
    </Box>
  )
}
