'use client'

import DocumentTextIcon from '@sanity/icons/DocumentText'
import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import { Box } from '@/components/common/Box'
import { NextImage } from '@/components/common/NextImage'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'
import { cn } from '@/lib/common-utils'
import type { getPreviewableKind } from '@/lib/file-preview'
import { useStoredFileUrl } from './FilePreviewContent'

export type ScriptFileThumbnailProps = {
  kind: ReturnType<typeof getPreviewableKind>
  fileKey: string
  fileName: string
  /** Same palette as the type badge. */
  color: string
  onPreview: () => void
}

/**
 * Thumbnail for one file: the real image for image files, a tinted type icon
 * for everything else. Previewable files are a button that opens the preview
 * modal; the full-size file only ever loads there.
 */
export function ScriptFileThumbnail({
  kind,
  fileKey,
  fileName,
  color,
  onPreview,
}: ScriptFileThumbnailProps) {
  const content =
    kind === 'image' ? (
      <ImageThumbnail fileKey={fileKey} fileName={fileName} color={color} />
    ) : (
      <FileTypeTile color={color} />
    )

  if (!kind) return content

  return (
    <button
      type='button'
      onClick={onPreview}
      aria-label={SCRIPT_STRINGS.file.previewAriaLabel(fileName)}
      className='block h-full w-full cursor-zoom-in rounded-md transition-opacity hover:opacity-90 focus-visible:opacity-90'
    >
      {content}
    </button>
  )
}

/** Tinted per file type (same palette as the type badge) so a row of files is
 * distinguishable at a glance, instead of a dark box with a tiny icon. Rounds
 * itself: the palette adds a 1px border, which a clipping parent would cut
 * off square at the corners. */
function FileTypeTile({ color }: { color: string }) {
  return (
    <Box
      className={cn(
        color,
        'flex h-full w-full items-center justify-center rounded-md text-6xl'
      )}
    >
      <DocumentTextIcon />
    </Box>
  )
}

function ImageThumbnail({
  fileKey,
  fileName,
  color,
}: {
  fileKey: string
  fileName: string
  color: string
}) {
  const state = useStoredFileUrl(fileKey)

  if (state.status === 'loading') {
    return <Skeleton loading className='h-full w-full rounded-md' />
  }

  // A failed signed-URL lookup just falls back to the type icon; the real
  // error (if any) surfaces when the preview modal is opened.
  if (state.status === 'error') return <FileTypeTile color={color} />

  return (
    <Box className='relative h-full w-full overflow-hidden rounded-md bg-background-100'>
      {/* `objectFitProp`, not a class: NextImage applies `className` to its
          skeleton wrapper and always sets the <img>'s own object-fit (contain
          by default), which letterboxed wide images in a tall box. `sizes`
          matches the card's widest thumbnail (20rem). */}
      <NextImage
        src={state.url}
        alt={SCRIPT_STRINGS.file.thumbnailAlt(fileName)}
        fillProp
        objectFitProp='cover'
        sizes='320px'
      />
    </Box>
  )
}
