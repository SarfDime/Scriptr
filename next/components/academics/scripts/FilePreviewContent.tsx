'use client'

import { useEffect, useState } from 'react'
import { Text } from '@/components/typography/Text'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { PreviewableFileKind } from '@/lib/file-preview'

export type FilePreviewContentProps = {
  url: string
  kind: PreviewableFileKind
  fileName: string
}

/**
 * Renders a single file inline — a PDF embed, or fetched-and-rendered plain
 * text. No modal chrome of its own; `FilePreviewModal` wraps this in a
 * `Dialog` for the click-to-open case, and `ScriptDetailPage`/
 * `PreviewScriptModal` render it directly for the auto-shown single-file
 * case, so this stays a pure content component either way.
 */
export function FilePreviewContent({
  url,
  kind,
  fileName,
}: FilePreviewContentProps) {
  if (kind === 'pdf') {
    return (
      <iframe
        src={url}
        title={fileName}
        className='h-[70vh] w-full rounded-lg border border-grey-200'
      />
    )
  }

  return <TextFilePreview url={url} fileName={fileName} />
}

type TextFilePreviewState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; text: string }

function TextFilePreview({ url, fileName }: { url: string; fileName: string }) {
  const [state, setState] = useState<TextFilePreviewState>({
    status: 'loading',
  })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load file')
        return response.text()
      })
      .then((text) => {
        if (!cancelled) setState({ status: 'ready', text })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [url])

  if (state.status === 'loading') {
    return <LoadingSpinner />
  }

  if (state.status === 'error') {
    return (
      <Text className='ui-caption text-danger-600'>
        Couldn't load {fileName} for preview.
      </Text>
    )
  }

  return (
    <pre className='ui-card max-h-[70vh] overflow-auto whitespace-pre-wrap p-4 ui-caption'>
      {state.text}
    </pre>
  )
}
