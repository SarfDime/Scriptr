'use client'

import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import dynamic from 'next/dynamic'
import { Box } from '@/components/common/Box'
import { RESTRICTED_EDITOR_OPTIONS } from '@/components/typography/portable-text/toolbar/editor-options'
import { cn } from '@/lib/common-utils'
import type { PortableTextEditorSectionProps } from '@/types/components/PortableTextEditor.types'

const PortableTextEditorSection = dynamic(
  () =>
    import(
      '@/components/typography/portable-text/PortableTextEditorSection'
    ).then((module) => module.PortableTextEditorSection),
  {
    ssr: false,
    loading: () => (
      <Box role='status' aria-busy='true' className='min-h-24 ui-above-inside'>
        {COMMENT_STRINGS.general.loadingEditor}
      </Box>
    ),
  }
)

/** The restricted rich-text editor used for comments, replies and edits. It
 * accepts every section prop (actions, validation, save…) except the toolbar
 * options, which are fixed here. */
export function CommentEditor({
  editorClassName,
  ...props
}: Omit<PortableTextEditorSectionProps, 'editorOptions'>) {
  return (
    <PortableTextEditorSection
      {...props}
      editorOptions={RESTRICTED_EDITOR_OPTIONS}
      editorClassName={cn('min-h-40', editorClassName)}
    />
  )
}
