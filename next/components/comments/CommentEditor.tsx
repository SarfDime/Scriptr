'use client'

import dynamic from 'next/dynamic'
import type { CommentEditorProps } from '@/types/components/comments/CommentThread.types'

const PortableTextEditorSection = dynamic(
  () =>
    import(
      '@/components/typography/portable-text/PortableTextEditorSection'
    ).then((module) => module.PortableTextEditorSection),
  { ssr: false }
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
  className,
}: CommentEditorProps) {
  return (
    <PortableTextEditorSection
      onChange={onChange}
      showActions={false}
      aria-label={ariaLabel}
      editorOptions={COMMENT_EDITOR_OPTIONS}
      editorClassName={className}
    />
  )
}
