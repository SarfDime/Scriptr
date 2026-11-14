'use client'

import TrashIcon from '@sanity/icons/Trash'
import { COMMENT_STRINGS_PACK } from '@shared/strings/comments-strings'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { ConfirmAction } from '@/components/ui/ConfirmAction'
import { useDeleteComment } from '@/hooks/comments/useDeleteComment'
import { useStrings } from '@/providers/locale/use-strings'

/** Delete with a confirmation step. Rendered for the author or an admin. */
export function CommentDeleteButton({ commentId }: { commentId: string }) {
  const strings = useStrings(COMMENT_STRINGS_PACK)
  const { isDeleting, remove } = useDeleteComment(commentId)

  return (
    <ConfirmAction
      title={strings.deletion.confirmTitle}
      description={strings.deletion.confirmDescription}
      confirmLabel={strings.deletion.confirmLabel}
      onConfirm={remove}
      trigger={(open) => (
        <Button
          onClick={open}
          disabled={isDeleting}
          className='button button-sm cp-danger-int'
        >
          <TrashIcon />
          <Text className='text-xs'>{strings.actions.delete}</Text>
        </Button>
      )}
    />
  )
}
