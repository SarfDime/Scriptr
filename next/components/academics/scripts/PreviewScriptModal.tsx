'use client'

import EyeOpen from '@sanity/icons/EyeOpen'
import { UI_STRINGS } from '@shared/config/strings'
import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
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
import { formatFileSize, getPreviewableKind } from '@/lib/file-preview'
import { getScriptFileLabel, getScriptFileName } from '@/lib/script-file-name'
import { ScriptDownloadButton } from './actions/ScriptDownloadButton'
import { StoredFilePreviewContent } from './FilePreviewContent'
import { ScriptPanel } from './ScriptPanel'

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
      onClose={onClose}
      dialogProps={{
        className:
          'overflow-hidden md:top-0 md:bottom-0 md:my-auto md:max-h-[90vh] md:w-[min(72rem,calc(100vw-2rem))] md:min-w-0 open:flex open:flex-col',
      }}
    >
      <Card.Body className='ui-stack min-h-0 flex-1 gap-4 overflow-y-auto p-5'>
        {description && (
          <ScriptPanel as='div'>
            <PortableTextContent>{description}</PortableTextContent>
          </ScriptPanel>
        )}

        {files.length === 0 ? (
          <Text className='ui-caption'>
            {UI_STRINGS.scripts.actions.noFilesAttached}
          </Text>
        ) : (
          <Box className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.65fr)]'>
            <ScriptPanel as='div' className='min-w-0'>
              {selectedFile && selectedFileKind && isOpen ? (
                <>
                  <Text className='ui-label' aria-live='polite'>
                    {SCRIPT_STRINGS.preview.previewing(
                      getScriptFileName(selectedFile)
                    )}
                  </Text>
                  <StoredFilePreviewContent
                    fileKey={selectedFile.file_url}
                    kind={selectedFileKind}
                    fileName={getScriptFileName(selectedFile)}
                  />
                </>
              ) : (
                <Text className='ui-caption'>
                  {SCRIPT_STRINGS.preview.noPreviewSelected}
                </Text>
              )}
            </ScriptPanel>

            <Box className='ui-stack min-w-0 gap-3'>
              <Box className='ui-stack gap-1'>
                <Title as='h3' className='ui-title'>
                  {SCRIPT_STRINGS.preview.filesTitle}
                </Title>
                <Text className='ui-caption'>
                  {SCRIPT_STRINGS.preview.filesSubtitle}
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
  const fileName = getScriptFileName(file)
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
          {getScriptFileLabel(file)}
        </Text>
        <Badge colorPalette={color}>{file.file_type.toUpperCase()}</Badge>
        <Text className='ui-caption'>
          {formatFileSize(file.file_size_bytes)}
        </Text>
      </Box>
      <Text className='ui-caption'>
        {SCRIPT_STRINGS.file.summary(file.file_type, Boolean(kind))}
      </Text>
      <Box className='ui-cluster gap-2'>
        {kind && (
          <Button
            onClick={onPreview}
            aria-label={SCRIPT_STRINGS.preview.previewFile(fileName)}
            aria-pressed={isSelected}
            className='button button-sm hollow grow'
          >
            <EyeOpen className='overwrite size-4 shrink-0' />
            {UI_STRINGS.scripts.actions.preview}
          </Button>
        )}
        <ScriptDownloadButton
          scriptId={scriptId}
          file={file}
          className='button-sm subtle grow'
        >
          {UI_STRINGS.scripts.actions.download}
        </ScriptDownloadButton>
      </Box>
    </ScriptPanel>
  )
}
