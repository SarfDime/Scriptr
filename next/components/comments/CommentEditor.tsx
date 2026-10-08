'use client'

import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import dynamic from 'next/dynamic'
import { Box } from '@/components/common/Box'
import { cn } from '@/lib/common-utils'
import type { CommentEditorProps } from '@/types/components/comments/CommentThread.types'

const PortableTextEditorSection = dynamic(
  () =>
    import(
      '@/components/typography/portable-text/PortableTextEditorSection'
    ).then((module) => module.PortableTextEditorSection),
  {
    ssr: false,
    loading: () => (
      <Box
        role='status'
        aria-busy='true'
        className='min-h-24 rounded-md border border-grey-300 bg-background-200 p-3 text-fg-muted'
      >
        {COMMENT_STRINGS.general.loadingEditor}
      </Box>
    ),
  }
)

const COMMENT_EDITOR_OPTIONS = {
  excludedStyles: ['h1', 'h2', 'h3', 'h4', 'h5', 'base', 'h6'],
  showStyles: false,
  showLists: false,
  showAlignment: false,
} as const

/** The restricted rich-text editor used for both comments and replies. Remount
 * it (via `key`) to clear it. */
export function CommentEditor({
  onChange,
  ariaLabel,
  initialContent,
  autoFocus = false,
  className,
}: CommentEditorProps) {
  return (
    <PortableTextEditorSection
      initialContent={initialContent}
      onChange={onChange}
      showActions={false}
      ariaLabel={ariaLabel}
      autoFocus={autoFocus}
      editorOptions={COMMENT_EDITOR_OPTIONS}
      editorClassName={cn('min-h-40', className)}
    />
  )
}
