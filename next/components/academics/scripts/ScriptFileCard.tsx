'use client'

import EyeOpen from '@sanity/icons/EyeOpen'
import { UI_STRINGS } from '@shared/config/strings'
import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import type { ScriptFile } from '@shared/types/scripts.types'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { Badge } from '@/components/ui/Badge'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import { formatFileSize, getPreviewableKind } from '@/lib/file-preview'
import { ScriptDownloadButton } from './actions/ScriptDownloadButton'
import { FilePreviewModal } from './FilePreviewModal'
import { ScriptFileThumbnail } from './ScriptFileThumbnail'
import { ScriptPanel } from './ScriptPanel'

export type ScriptFileCardProps = {
  scriptId: string
  file: ScriptFile
  /** `tile`: always a compact stacked card. `wide`: stacked while the card is narrow, switching to a thumbnail-beside-details row once the card itself is wide enough (container query on the card, not the viewport) — so it adapts to however much room the grid gives it. */
  layout?: 'tile' | 'wide'
}

/**
 * Card for one file of a script. Composes the thumbnail, the type/size
 * details and the actions, and owns the preview modal that the thumbnail and
 * the Preview button both open. The full-size file only ever loads in the
 * modal, so a script with many files stays light.
 */
export function ScriptFileCard({
  scriptId,
  file,
  layout = 'tile',
}: ScriptFileCardProps) {
  const isWide = layout === 'wide'
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const kind = getPreviewableKind(file.file_type)
  const color = getColorPalette({ type: 'seed', value: file.file_type })
  const displayPosition = file.position + 1
  const fileName = SCRIPT_STRINGS.file.name(displayPosition, file.file_type)
  const openPreview = () => setIsPreviewOpen(true)

  const buttonClass = cn('grow button-md', isWide && '@md:min-w-28 @md:grow-0')

  return (
    // `@container` makes the card the query container for the `@md:` variants
    // below, so the row layout depends on the card's own width. A ScriptPanel
    // (inner fill) sitting on the files' frosted surface.
    <ScriptPanel
      as='div'
      className={cn('min-w-0 overflow-hidden', isWide && '@container')}
    >
      <Box
        className={cn('flex flex-1 flex-col gap-4', isWide && '@md:flex-row')}
      >
        {/* Fixed height in both layouts: the thumbnail never follows the
            card's height, which can be stretched by neighbouring panels. No
            clipping here; each thumbnail variant rounds (and clips) itself. */}
        <Box
          className={cn(
            'h-44 w-full shrink-0',
            isWide && '@md:h-48 @md:w-1/2 @md:max-w-80'
          )}
        >
          <ScriptFileThumbnail
            kind={kind}
            fileKey={file.file_url}
            fileName={fileName}
            color={color}
            onPreview={openPreview}
          />
        </Box>
        {/* Details always fill the remaining space and keep the actions at the
            bottom, so cards of equal height line up in either layout. */}
        <Box className='ui-stack min-w-0 grow justify-between gap-2'>
          <Box className='ui-stack gap-2'>
            {/* Label, type and size read as one line; they used to be pushed
                to opposite edges, which left a gap across a wide card. */}
            <Box className='ui-cluster items-center gap-2'>
              <Text className='ui-label'>
                {SCRIPT_STRINGS.file.label(displayPosition)}
              </Text>
              <Badge colorPalette={color}>{file.file_type.toUpperCase()}</Badge>
              <Text className='ui-caption'>
                {formatFileSize(file.file_size_bytes)}
              </Text>
            </Box>
            {isWide && (
              <Text className='ui-caption'>
                {SCRIPT_STRINGS.file.summary(file.file_type, Boolean(kind))}
              </Text>
            )}
          </Box>
          <Box className='ui-cluster gap-2'>
            {Boolean(kind) && (
              <Button
                onClick={openPreview}
                className={cn('button hollow', buttonClass)}
              >
                <EyeOpen className={'overwrite size-5 shrink-0'} />
                {UI_STRINGS.scripts.actions.preview}
              </Button>
            )}
            <ScriptDownloadButton
              scriptId={scriptId}
              file={file}
              className={cn('solid', buttonClass)}
            >
              {UI_STRINGS.scripts.actions.download}
            </ScriptDownloadButton>
          </Box>
        </Box>
      </Box>
      {kind && (
        <FilePreviewModal
          file={{
            url: file.file_url,
            isStoredFile: true,
            fileName,
            fileType: file.file_type,
          }}
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
        />
      )}
    </ScriptPanel>
  )
}
