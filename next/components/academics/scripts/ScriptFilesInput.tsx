'use client'

import { ALLOWED_EXTENSIONS } from '@shared/config/shared-constants'
import { UI_STRINGS } from '@shared/config/strings'
import { useId, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { Field } from '@/components/ui/field/Field'
import { cn } from '@/lib/common-utils'
import {
  formatFileSize,
  getFileTypeFromFilename,
  getPreviewableKind,
} from '@/lib/file-preview'
import type {
  FileWithError,
  ScriptFilesInputProps,
} from '@/types/components/ScriptFilesInput.types'
import { FilePreviewModal } from './FilePreviewModal'

/**
 * The files field shared by the create and edit script forms: a dropzone plus
 * the list of staged files. Presentational; the staged state lives in the
 * parent (see `useScriptFilePicker`).
 */
export function ScriptFilesInput({
  files,
  disabled,
  note,
  onAdd,
  onRemove,
  fieldProps,
}: ScriptFilesInputProps) {
  const hasFileErrors = files.some((entry) => entry.error !== null)

  return (
    // No label on the Field: the dropzone carries its own title and help.
    <Field
      {...fieldProps}
      className={cn('min-w-0', fieldProps?.className)}
      errorText={
        hasFileErrors
          ? UI_STRINGS.scripts.uploadModal.fieldErrors.filesInvalid
          : undefined
      }
      valid={!hasFileErrors}
      invalid={hasFileErrors}
    >
      <Box className='ui-stack gap-2'>
        <FileDropzone
          label={UI_STRINGS.scripts.uploadModal.filesLabel}
          help={UI_STRINGS.scripts.uploadModal.filesHelp}
          note={note}
          onFiles={onAdd}
          disabled={disabled}
          valid={!hasFileErrors}
          invalid={hasFileErrors}
        />
        {/* {note && <Text className='ui-caption'>{note}</Text>} */}
        {files.length > 0 && (
          <Box className='ui-stack min-w-0 w-full gap-2'>
            {files.map((entry, index) => (
              <FileRow
                key={`${entry.file.name}-${index}`}
                entry={entry}
                onRemove={() => onRemove(index)}
                disabled={disabled}
              />
            ))}
          </Box>
        )}
      </Box>
    </Field>
  )
}

/** Drop target that doubles as the field's label: the title and help text
 * live inside the box, so the section needs no separate heading. The border
 * reflects validation state. */
function FileDropzone({
  label,
  help,
  note,
  onFiles,
  disabled,
  valid,
  invalid,
}: {
  label: string
  help: string
  note?: string
  onFiles: (files: FileList | null) => void
  disabled: boolean
  valid: boolean
  invalid: boolean
}) {
  const inputId = useId()
  const [isDragging, setIsDragging] = useState(false)

  const borderClass = (() => {
    if (isDragging) return 'border-brand border-solid'
    if (invalid) return 'cp-danger'
    if (valid) return 'cp-success'
    return 'border-grey-300'
  })()

  return (
    <Box className='relative'>
      <input
        id={inputId}
        type='file'
        multiple
        accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
        disabled={disabled}
        aria-invalid={invalid}
        className='peer sr-only'
        onChange={(event) => {
          onFiles(event.target.files)
          // Reset so re-selecting a just-removed file fires onChange again.
          event.target.value = ''
        }}
      />
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          if (!disabled) onFiles(event.dataTransfer.files)
        }}
        className={cn(
          'ui-stack cursor-pointer items-center justify-center gap-1 rounded-lg  px-2 py-3 text-center',
          'ui-above-inside border-dashed border-2 shadow-none',
          'hover:border-brand-300 hover:bg-background-150 transition-colors',
          'peer-focus-visible:outline-2 peer-disabled:pointer-events-none peer-disabled:opacity-50',
          borderClass
        )}
      >
        <span className='text-base font-semibold'>{label}</span>
        <span className='ui-caption'>{help}</span>
        <span className='ui-caption'>{note}</span>
      </label>
    </Box>
  )
}

/** One row in the not-yet-uploaded files list: name, size, any validation
 * error, a Preview trigger when the extension is a previewable type, and
 * Remove. */
function FileRow({
  entry,
  onRemove,
  disabled,
}: {
  entry: FileWithError
  onRemove: () => void
  disabled: boolean
}) {
  const fileType = getFileTypeFromFilename(entry.file.name)
  const isPreviewable =
    entry.error === null && fileType !== null && getPreviewableKind(fileType)

  return (
    <Box className='grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-grey-200 bg-background-200 p-1'>
      <Box className='ui-stack min-w-0 flex-1 gap-0.5 overflow-hidden'>
        <Text className='ui-caption block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap'>
          {entry.file.name}
        </Text>
        <Text className='ui-caption'>{formatFileSize(entry.file.size)}</Text>
        {entry.error && (
          <Text className='ui-caption cp-danger-nb'>{entry.error}</Text>
        )}
      </Box>
      <Box className='flex shrink-0 items-center gap-2'>
        {isPreviewable && fileType && (
          <FilePreviewModal
            file={{
              localFile: entry.file,
              fileName: entry.file.name,
              fileType,
            }}
          />
        )}
        <Button
          onClick={onRemove}
          disabled={disabled}
          className='button button-sm danger rounded-md'
          aria-label={`Remove ${entry.file.name}`}
        >
          {UI_STRINGS.scripts.uploadModal.removeButtonLabel}
        </Button>
      </Box>
    </Box>
  )
}
