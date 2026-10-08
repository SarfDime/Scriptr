'use client'

import { PORTABLE_TEXT_LIMITS } from '@shared/config/portable-text-limits'
import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import {
  isCommentPortableTextValue,
  isValidCommentPortableTextValue,
  portableTextJsonByteLength,
  portableTextToPlainText,
} from '@shared/utils/portable-text.utils'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { useProtectedAction } from '@/hooks/useProtectedAction'
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
  const { api, updateComment } = useCommentsServices()
  const [content, setContent] = useState<PortableTextValue>(comment.content)
  const { state, run } = useProtectedAction(api.patchComment, {
    errorTitle: COMMENT_STRINGS.composer.editError,
  })
  const plainTextLength = portableTextToPlainText(content).trim().length
  const hasMinimumLength =
    plainTextLength >= PORTABLE_TEXT_LIMITS.commentMinimumCharacters
  const isTooLarge =
    isCommentPortableTextValue(content) &&
    portableTextJsonByteLength(content) >
      PORTABLE_TEXT_LIMITS.commentMaximumBytes
  const isValid = hasMinimumLength && isValidCommentPortableTextValue(content)

  const handleSave = async () => {
    if (!isValid) return
    const result = await run(comment.id, content)
    if (result.ok) {
      updateComment(result.data.comment)
      onClose()
    }
  }

  return (
    <Box className='ui-stack gap-2'>
      <CommentEditor
        initialContent={comment.content}
        onChange={setContent}
        ariaLabel={COMMENT_STRINGS.composer.editorAriaLabel}
        autoFocus
        className='min-h-24'
      />
      {!hasMinimumLength && (
        <Text role='alert' className='ui-caption text-danger-600'>
          {COMMENT_STRINGS.general.minimumLength()}
        </Text>
      )}
      {isTooLarge && (
        <Text role='alert' className='ui-caption text-danger-600'>
          {COMMENT_STRINGS.validation.maximumSize(
            PORTABLE_TEXT_LIMITS.commentMaximumBytes
          )}
        </Text>
      )}
      <Box className='ui-cluster justify-end gap-2'>
        <Button onClick={onClose} className='button subtle'>
          {COMMENT_STRINGS.reply.cancel}
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isValid || state.status === 'pending'}
          className='button solid'
        >
          {COMMENT_STRINGS.composer.saveEdit}
        </Button>
      </Box>
    </Box>
  )
}
