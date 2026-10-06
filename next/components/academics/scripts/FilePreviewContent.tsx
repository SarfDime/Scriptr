'use client'

import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import { useEffect, useState } from 'react'
import { Box } from '@/components/common/Box'
import { NextImage } from '@/components/common/NextImage'
import { Text } from '@/components/typography/Text'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getScriptFileUrl } from '@/lib/api/scripts-api'
import type { PreviewableFileKind } from '@/lib/file-preview'

export type FilePreviewContentProps = {
  url: string
  kind: PreviewableFileKind
  fileName: string
}

/**
 * Renders a single file inline — a PDF embed, an image, or
 * fetched-and-rendered plain text. No modal chrome of its own; `FilePreviewModal` wraps this in a
 * `Dialog` for the click-to-open case, and `ScriptDetailPage`/
 * `PreviewScriptModal` render it directly for the auto-shown single-file
 * case, so this stays a pure content component either way.
 */
export function FilePreviewContent({
  url,
  kind,
  fileName,
}: FilePreviewContentProps) {
  if (kind === 'image') {
    // Fill mode needs a sized, positioned parent. Local `blob:` URLs (the
    // create-script flow) are served as-is by next/image automatically.
    return (
      <Box className='relative h-[70vh] w-full overflow-hidden rounded-lg bg-background-200'>
        <NextImage
          src={url}
          alt={fileName}
          fillProp
          className='rounded-lg object-contain'
        />
      </Box>
    )
  }

  if (kind === 'pdf') {
    return (
      <iframe
        src={url}
        title={fileName}
        className='h-[75vh] w-full rounded-lg border border-grey-300 bg-background-100'
      />
    )
  }

  return <TextFilePreview url={url} fileName={fileName} />
}

type StoredFileUrlState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; url: string }

/** Resolves a stored file's key to a signed URL. Shared by the full preview
 * (`StoredFilePreviewContent`) and the file-card thumbnails. */
export function useStoredFileUrl(fileKey: string): StoredFileUrlState {
  const [state, setState] = useState<StoredFileUrlState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    getScriptFileUrl(fileKey)
      .then(({ url }) => {
        if (!cancelled) setState({ status: 'ready', url })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [fileKey])

  return state
}

export function StoredFilePreviewContent({
  fileKey,
  kind,
  fileName,
}: Omit<FilePreviewContentProps, 'url'> & { fileKey: string }) {
  const state = useStoredFileUrl(fileKey)

  if (state.status === 'loading') return <LoadingSpinner />

  if (state.status === 'error') {
    return (
      <Text className='ui-caption text-danger-600'>
        {SCRIPT_STRINGS.preview.loadFailed(fileName)}
      </Text>
    )
  }

  return <FilePreviewContent url={state.url} kind={kind} fileName={fileName} />
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
        // TODO: Cache file since they never change
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
        {SCRIPT_STRINGS.preview.loadFailed(fileName)}
      </Text>
    )
  }

  return (
    <pre className='ui-card max-h-[70vh] overflow-auto whitespace-pre-wrap p-4 ui-caption'>
      {state.text}
    </pre>
  )
}
