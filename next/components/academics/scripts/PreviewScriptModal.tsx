'use client'

import { UI_STRINGS } from '@shared/config/strings'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { ScriptFile } from '@shared/types/scripts.types'
import { Box } from '@/components/common/Box'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { getPreviewableKind } from '@/lib/file-preview'
import { ScriptDownloadButton } from './actions/ScriptDownloadButton'
import { FilePreviewContent } from './FilePreviewContent'

export type PreviewScriptModalProps = {
  scriptId: string
  title: PortableTextValue
  description?: PortableTextValue
  files: Array<ScriptFile>
  isOpen: boolean
  onClose: () => void
}

/**
 * Preview surface for a whole script: title, description, and its files.
 * If there's exactly one file and it's a previewable type (pdf or md),
 * that file is shown inline. Otherwise — multiple files, zero files, or a
 * single non-previewable file — falls back to a ScriptDownloadButton per
 * file, same as the script detail page's own file list.
 */
export function PreviewScriptModal({
  scriptId,
  title,
  description,
  files,
  isOpen,
  onClose,
}: PreviewScriptModalProps) {
  const onlyFile = files.length === 1 ? files[0] : null
  const onlyFileKind = onlyFile ? getPreviewableKind(onlyFile.file_type) : null

  return (
    <Dialog
      title={
        <PortableTextContent renderWrapper={false}>{title}</PortableTextContent>
      }
      hideTrigger
      isOpen={isOpen}
      onClose={onClose}
    >
      <Card.Body className='ui-stack gap-4'>
        {description && (
          <PortableTextContent renderWrapper={false}>
            {description}
          </PortableTextContent>
        )}

        {onlyFile && onlyFileKind ? (
          <FilePreviewContent
            url={onlyFile.file_url}
            kind={onlyFileKind}
            fileName={`Script file (${onlyFile.file_type})`}
          />
          // biome-ignore lint/style/noNestedTernary: <Ignore>
        ) : files.length > 0 ? (
          <Box className='ui-stack gap-2'>
            {files.map((file) => (
              <ScriptDownloadButton
                key={file.id}
                scriptId={scriptId}
                file={file}
              />
            ))}
          </Box>
        ) : (
          <Text className='ui-caption text-grey-500'>
            {UI_STRINGS.scripts.actions.noFilesAttached}
          </Text>
        )}
      </Card.Body>
    </Dialog>
  )
}
