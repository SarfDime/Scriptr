'use client'

import CollapseIcon from '@sanity/icons/Collapse'
import ExpandIcon from '@sanity/icons/Expand'
import EyeOpen from '@sanity/icons/EyeOpen'
import { SCRIPT_STRINGS_PACK } from '@shared/strings/scripts-strings'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { ScriptFile } from '@shared/types/scripts.types'
import { useEffect, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import { formatFileSize, getPreviewableKind } from '@/lib/file-preview'
import { getScriptFileLabel, getScriptFileName } from '@/lib/script-file-name'
import { useStrings, useUIStrings } from '@/providers/locale/use-strings'
import { ScriptDownloadButton } from './actions/ScriptDownloadButton'
import { StoredFilePreviewContent } from './FilePreviewContent'
import { ScriptPanel } from './ScriptPanel'

// Fullscreen: the dialog covers the viewport as a flex column so the preview
// takes everything under the header, which keeps the title and the controls.
const PREVIEW_FULLSCREEN_DIALOG_CLASS =
  'overflow-hidden open:flex open:flex-col md:top-0 md:h-dvh md:max-h-dvh md:w-screen md:max-w-none md:min-w-0 md:rounded-none md:border-0 md:shadow-none'

export type PreviewScriptModalProps = {
  scriptId: string
  title: PortableTextValue
  description?: PortableTextValue
  files: Array<ScriptFile>
  isOpen: boolean
  onClose: () => void
}

export function PreviewScriptModal({
  scriptId,
  title,
  description,
  files,
  isOpen,
  onClose,
}: PreviewScriptModalProps) {
  const strings = useStrings(SCRIPT_STRINGS_PACK)
  const ui = useUIStrings()
  const [isFullscreen, setIsFullscreen] = useState(false)

  const firstPreviewableFile = files.find((file) =>
    Boolean(getPreviewableKind(file.file_type))
  )
  const [selectedFileId, setSelectedFileId] = useState<string | null>(
    firstPreviewableFile?.id ?? null
  )
  const selectedFile =
    files.find((file) => file.id === selectedFileId) ?? firstPreviewableFile
  const selectedFileKind = selectedFile
    ? getPreviewableKind(selectedFile.file_type)
    : null
  const previewable = Boolean(selectedFile && selectedFileKind && isOpen)

  const handleClose = () => {
    setIsFullscreen(false)
    onClose()
  }

  useEffect(() => {
    if (
      !isOpen ||
      (selectedFileId !== null &&
        files.some((file) => file.id === selectedFileId))
    ) {
      return
    }

    setSelectedFileId(firstPreviewableFile?.id ?? null)
  }, [files, firstPreviewableFile, isOpen, selectedFileId])

  return (
    <Dialog
      title={<PortableTextContent>{title}</PortableTextContent>}
      hideTrigger
      isOpen={isOpen}
      onClose={handleClose}
      headerActions={
        previewable ? (
          <Button
            onClick={() => setIsFullscreen((current) => !current)}
            aria-label={
              isFullscreen
                ? strings.preview.exitFullscreen
                : strings.preview.enterFullscreen
            }
            className='button ghost p-1'
          >
            {isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
          </Button>
        ) : undefined
      }
      dialogProps={{
        className: cn(
          'overflow-hidden md:top-0 md:bottom-0 md:my-auto md:max-h-[90vh] md:w-[min(72rem,calc(100vw-2rem))] md:min-w-0 open:flex open:flex-col',
          isFullscreen && PREVIEW_FULLSCREEN_DIALOG_CLASS
        ),
      }}
    >
      {/* One tree for both sizes, so toggling never remounts (reloads) the preview. */}
      <Card.Body
        className={cn(
          'ui-stack min-h-0 flex-1',
          isFullscreen
            ? 'flex flex-col gap-0 overflow-hidden p-0'
            : 'gap-4 overflow-y-auto p-5'
        )}
      >
        {description && (
          <ScriptPanel as='div' className={cn(isFullscreen && 'hidden')}>
            <PortableTextContent>{description}</PortableTextContent>
          </ScriptPanel>
        )}

        {files.length === 0 ? (
          <Text className='ui-caption'>
            {ui.scripts.actions.noFilesAttached}
          </Text>
        ) : (
          <Box
            className={cn(
              'grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.65fr)]',
              isFullscreen && 'flex min-h-0 flex-1'
            )}
          >
            <ScriptPanel
              as='div'
              className={cn(
                'min-w-0',
                isFullscreen &&
                  'min-h-0 flex-1 gap-0 rounded-none border-0 bg-background-200 p-0'
              )}
            >
              {selectedFile && selectedFileKind && isOpen ? (
                <>
                  <Text
                    className={cn('ui-label', isFullscreen && 'hidden')}
                    aria-live='polite'
                  >
                    {strings.preview.previewing(
                      getScriptFileName(selectedFile, strings)
                    )}
                  </Text>
                  <StoredFilePreviewContent
                    fileKey={selectedFile.file_url}
                    kind={selectedFileKind}
                    fileName={getScriptFileName(selectedFile, strings)}
                    fillHeight={isFullscreen}
                  />
                </>
              ) : (
                <Text className='ui-caption'>
                  {strings.preview.noPreviewSelected}
                </Text>
              )}
            </ScriptPanel>

            <Box
              className={cn('ui-stack min-w-0 gap-3', isFullscreen && 'hidden')}
            >
              <Box className='ui-stack gap-1'>
                <Title as='h3' className='ui-title'>
                  {strings.preview.filesTitle}
                </Title>
                <Text className='ui-caption'>
                  {strings.preview.filesSubtitle}
                </Text>
              </Box>

              {files.map((file) => (
                <PreviewFileRow
                  key={file.id}
                  file={file}
                  scriptId={scriptId}
                  isSelected={selectedFile?.id === file.id}
                  onPreview={() => setSelectedFileId(file.id)}
                />
              ))}
            </Box>
          </Box>
        )}
      </Card.Body>
    </Dialog>
  )
}

function PreviewFileRow({
  file,
  scriptId,
  isSelected,
  onPreview,
}: {
  file: ScriptFile
  scriptId: string
  isSelected: boolean
  onPreview: () => void
}) {
  const strings = useStrings(SCRIPT_STRINGS_PACK)
  const ui = useUIStrings()
  const fileName = getScriptFileName(file, strings)
  const kind = getPreviewableKind(file.file_type)
  const color = getColorPalette({ type: 'seed', value: file.file_type })

  return (
    <ScriptPanel
      as='div'
      className='ui-stack min-w-0 gap-3 p-3'
      aria-current={isSelected || undefined}
    >
      <Box className='ui-cluster min-w-0 items-center gap-2'>
        <Text className='ui-label min-w-0 max-w-full truncate'>
          {getScriptFileLabel(file, strings)}
        </Text>
        <Badge colorPalette={color}>{file.file_type.toUpperCase()}</Badge>
        <Text className='ui-caption'>
          {formatFileSize(file.file_size_bytes)}
        </Text>
      </Box>
      <Text className='ui-caption'>
        {strings.file.summary(file.file_type, Boolean(kind))}
      </Text>
      <Box className='ui-cluster gap-2'>
        {kind && (
          <Button
            onClick={onPreview}
            aria-label={strings.preview.previewFile(fileName)}
            aria-pressed={isSelected}
            className='button button-sm hollow grow'
          >
            <EyeOpen className='overwrite size-4 shrink-0' />
            {ui.scripts.actions.preview}
          </Button>
        )}
        <ScriptDownloadButton
          scriptId={scriptId}
          file={file}
          className='button-sm subtle grow'
        >
          {ui.scripts.actions.download}
        </ScriptDownloadButton>
      </Box>
    </ScriptPanel>
  )
}
