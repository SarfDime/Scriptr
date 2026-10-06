'use client'

import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import { useRichTextDraft } from '@/hooks/useRichTextDraft'
import { CommentEditor } from './CommentEditor'
import { useCommentsServices } from './CommentsProvider'

/** Editor card for a new top-level comment. Mounted only while composing, so
 * closing it discards the draft by unmounting. */
export function CommentComposer({ onClose }: { onClose: () => void }) {
  const { target, api, addComment } = useCommentsServices()
  const draft = useRichTextDraft()
  const [showPreview, setShowPreview] = useState(false)
  const { state, run } = useProtectedAction(api.postComment, {
    errorTitle: COMMENT_STRINGS.composer.postError,
  })

  const handleClear = () => {
    draft.reset()
    setShowPreview(false)
  }

  const handleSubmit = async () => {
    if (!draft.content || !draft.hasContent) return
    const result = await run(target, draft.content)
    if (result.ok) {
      addComment(result.data.comment)
      onClose()
    }
  }

  return (
    <Card className='ui-above'>
      <Card.Body className='ui-stack gap-3'>
        <CommentEditor
          key={draft.editorKey}
          onChange={draft.setContent}
          ariaLabel={COMMENT_STRINGS.composer.editorAriaLabel}
        />
        {showPreview && draft.content && draft.hasContent && (
          <Box className='ui-stack gap-1 rounded-lg bg-background-100/85 p-3'>
            <Text className='ui-caption text-grey-500'>
              {COMMENT_STRINGS.composer.previewLabel}
            </Text>
            <PortableTextContent renderWrapper={false}>
              {draft.content}
            </PortableTextContent>
          </Box>
        )}
        <Box className='ui-cluster items-center justify-between gap-x-3 gap-y-2'>
          <Text className='ui-caption text-grey-500'>
            {COMMENT_STRINGS.composer.characterCount(draft.characterCount)}
          </Text>
          <Box className='ui-cluster items-center justify-end gap-2'>
            <Button
              onClick={handleClear}
              disabled={!draft.hasContent}
              className='button subtle'
            >
              {COMMENT_STRINGS.composer.clear}
            </Button>
            <Button
              onClick={() => setShowPreview((open) => !open)}
              disabled={!draft.hasContent}
              aria-pressed={showPreview}
              className='button ghost'
            >
              {showPreview
                ? COMMENT_STRINGS.composer.hidePreview
                : COMMENT_STRINGS.composer.showPreview}
            </Button>
            <Button onClick={onClose} className='button subtle'>
              {COMMENT_STRINGS.composer.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!draft.hasContent || state.status === 'pending'}
              className='button solid'
            >
              {COMMENT_STRINGS.composer.submit}
            </Button>
          </Box>
        </Box>
      </Card.Body>
    </Card>
  )
}
