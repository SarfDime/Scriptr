'use client'

import TrashIcon from '@sanity/icons/Trash'
import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { ConfirmAction } from '@/components/ui/ConfirmAction'
import { useDeleteComment } from '@/hooks/comments/useDeleteComment'

/** Delete with a confirmation step. Rendered for the author or an admin. */
export function CommentDeleteButton({ commentId }: { commentId: string }) {
  const { isDeleting, remove } = useDeleteComment(commentId)

  return (
    <ConfirmAction
      title={COMMENT_STRINGS.deletion.confirmTitle}
      description={COMMENT_STRINGS.deletion.confirmDescription}
      confirmLabel={COMMENT_STRINGS.deletion.confirmLabel}
      onConfirm={remove}
      trigger={(open) => (
        <Button
          onClick={open}
          disabled={isDeleting}
          className='button button-sm cp-danger-int'
        >
          <TrashIcon />
          <Text className='text-xs'>{COMMENT_STRINGS.actions.delete}</Text>
        </Button>
      )}
    />
  )
}
