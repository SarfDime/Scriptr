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

const LOADING_FILE_URL: StoredFileUrlState = { status: 'loading' }

/** Resolves a stored file's key to a signed URL. Shared by the full preview
 * (`StoredFilePreviewContent`) and the file-card thumbnails. */
export function useStoredFileUrl(fileKey: string): StoredFileUrlState {
  const [resolved, setResolved] = useState<{
    fileKey: string
    state: StoredFileUrlState
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    getScriptFileUrl(fileKey)
      .then(({ url }) => {
        if (!cancelled) {
          setResolved({ fileKey, state: { status: 'ready', url } })
        }
      })
      .catch(() => {
        if (!cancelled) setResolved({ fileKey, state: { status: 'error' } })
      })

    return () => {
      cancelled = true
    }
  }, [fileKey])

  // A URL belongs to the key it was signed for, so a new key reads as loading
  // without a state write of its own.
  return resolved?.fileKey === fileKey ? resolved.state : LOADING_FILE_URL
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

const LOADING_TEXT: TextFilePreviewState = { status: 'loading' }

const textFileCache = new Map<string, string>()

/** A cached body wins on first paint; a fetch that already finished for this
 * key wins over it, because it may hold a newer response. */
function resolveTextState(
  cacheKey: string,
  fetched: { cacheKey: string; state: TextFilePreviewState } | null
): TextFilePreviewState {
  if (fetched?.cacheKey === cacheKey) return fetched.state
  const cachedText = textFileCache.get(cacheKey)
  return cachedText === undefined
    ? LOADING_TEXT
    : { status: 'ready', text: cachedText }
}

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
  const [fetched, setFetched] = useState<{
    cacheKey: string
    state: TextFilePreviewState
  } | null>(null)

  useEffect(() => {
    if (textFileCache.has(cacheKey)) return undefined

    let cancelled = false

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load file')
        return response.text()
      })
      .then((text) => {
        textFileCache.set(cacheKey, text)
        if (!cancelled) {
          setFetched({ cacheKey, state: { status: 'ready', text } })
        }
      })
      .catch(() => {
        if (!cancelled) setFetched({ cacheKey, state: { status: 'error' } })
      })

    return () => {
      cancelled = true
    }
  }, [cacheKey, url])

  const state = resolveTextState(cacheKey, fetched)

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
