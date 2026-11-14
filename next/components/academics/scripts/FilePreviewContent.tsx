'use client'

import { SCRIPT_STRINGS_PACK } from '@shared/strings/scripts-strings'
import { useEffect, useState } from 'react'
import { Box } from '@/components/common/Box'
import { NextImage } from '@/components/common/NextImage'
import { Text } from '@/components/typography/Text'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getScriptFileUrl } from '@/lib/api/scripts-api'
import { cn } from '@/lib/common-utils'
import type { PreviewableFileKind } from '@/lib/file-preview'
import { useStrings } from '@/providers/locale/use-strings'
import { IMAGE_SIZES } from '@/styles/style'

export type FilePreviewContentProps = {
  url: string
  kind: PreviewableFileKind
  fileName: string
  cacheKey?: string
  /** Fill the parent's height (a flex column) instead of the fixed
   * viewport-relative heights. Used by the fullscreen preview. */
  fillHeight?: boolean
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
  cacheKey,
  fillHeight = false,
}: FilePreviewContentProps) {
  const frameClass = fillHeight ? 'min-h-0 flex-1' : 'h-[70vh] rounded-lg'
  const radiusClass = fillHeight ? '' : 'rounded-lg'

  if (kind === 'image') {
    if (url.startsWith('blob:')) {
      return (
        <Box
          className={cn(
            'relative w-full overflow-hidden bg-background-200',
            frameClass
          )}
        >
          {/* biome-ignore lint/performance/noImgElement: Blob URLs are local, transient files and cannot use Next image optimization. */}
          <img
            src={url}
            alt={fileName}
            className={cn('block h-full w-full object-contain', radiusClass)}
          />
        </Box>
      )
    }

    // Fill mode needs a sized, positioned parent. Local `blob:` URLs (the
    // create-script flow) use the native image path above because they are
    // not eligible for Next's image optimization.
    return (
      <Box
        className={cn(
          'relative w-full overflow-hidden bg-background-200',
          frameClass
        )}
      >
        <NextImage
          src={url}
          alt={fileName}
          fillProp
          sizes={IMAGE_SIZES.FILE_PREVIEW}
          className={cn('object-contain', radiusClass)}
        />
      </Box>
    )
  }

  if (kind === 'pdf') {
    return (
      <iframe
        src={url}
        title={fileName}
        className={cn(
          'w-full bg-background-100',
          fillHeight
            ? 'min-h-0 flex-1 border-0'
            : 'h-[75vh] rounded-lg border border-grey-300'
        )}
      />
    )
  }

  return (
    <TextFilePreview
      url={url}
      fileName={fileName}
      cacheKey={cacheKey ?? fileName}
      fillHeight={fillHeight}
    />
  )
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
  fillHeight,
}: Omit<FilePreviewContentProps, 'url'> & { fileKey: string }) {
  const state = useStoredFileUrl(fileKey)
  const strings = useStrings(SCRIPT_STRINGS_PACK)

  if (state.status === 'loading') return <LoadingSpinner />

  if (state.status === 'error') {
    return (
      <Text className='ui-caption cp-danger-nb'>
        {strings.preview.loadFailed(fileName)}
      </Text>
    )
  }

  return (
    <FilePreviewContent
      url={state.url}
      kind={kind}
      fileName={fileName}
      cacheKey={fileKey}
      fillHeight={fillHeight}
    />
  )
}

type TextFilePreviewState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; text: string }

const textFileCache = new Map<string, string>()

function TextFilePreview({
  url,
  fileName,
  cacheKey,
  fillHeight,
}: {
  url: string
  fileName: string
  cacheKey: string
  fillHeight: boolean
}) {
  const strings = useStrings(SCRIPT_STRINGS_PACK)
  const [state, setState] = useState<TextFilePreviewState>({
    status: 'loading',
  })

  useEffect(() => {
    let cancelled = false
    const cachedText = textFileCache.get(cacheKey)
    if (cachedText !== undefined) {
      setState({ status: 'ready', text: cachedText })
      return () => {
        cancelled = true
      }
    }

    setState({ status: 'loading' })

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load file')
        return response.text()
      })
      .then((text) => {
        textFileCache.set(cacheKey, text)
        if (!cancelled) setState({ status: 'ready', text })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [cacheKey, url])

  if (state.status === 'loading') {
    return <LoadingSpinner />
  }

  if (state.status === 'error') {
    return (
      <Text className='ui-caption cp-danger-nb'>
        {strings.preview.loadFailed(fileName)}
      </Text>
    )
  }

  return (
    <pre
      className={cn(
        'ui-card overflow-auto whitespace-pre-wrap p-4 ui-caption',
        fillHeight ? 'min-h-0 flex-1' : 'max-h-[70vh]'
      )}
    >
      {state.text}
    </pre>
  )
}
