'use client'

import DocumentPdf from '@sanity/icons/DocumentPdf'
import User from '@sanity/icons/User'
import { ALLOWED_EXTENSIONS } from '@shared/config/shared-constants'
import { UI_STRINGS } from '@shared/config/strings'
import type { SubjectExamSession } from '@shared/types/academic.types'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SubjectCard } from '@/components/Subjects/SubjectCard'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/select/Select'
import {
  type FileWithError,
  formatFileSize,
  useCreateScriptForm,
} from '@/hooks/useCreateScriptForm'
import { cn } from '@/lib/common-utils'
import { getFileTypeFromFilename, getPreviewableKind } from '@/lib/file-preview'
import type { MinimalSubject } from '@/types/academics/subject.types'
import { FilePreviewModal } from './FilePreviewModal'

export type CreateScriptModalProps = {
  subject: MinimalSubject
  onCreated?: (scriptId: string) => void
  triggerLabel?: string
}

/**
 * Create-script modal. All form state and file validation live in
 * `useCreateScriptForm` — this component is presentation + wiring only,
 * same division of responsibility it already had with `useScriptUpload`
 * for the actual upload, just extended one layer further up.
 */
export function CreateScriptModal({
  subject,
  onCreated,
  triggerLabel = 'New script',
}: CreateScriptModalProps) {
  const {
    titleText,
    setTitleText,
    descriptionText,
    setDescriptionText,
    setProfessorId,
    setExamSession,
    readingLinks,
    addReadingLink,
    updateReadingLink,
    removeReadingLink,
    files,
    addFiles,
    removeFile,
    clearFiles,
    isBusy,
    canSubmit,
    professors,
    examSessions,
    uploadState,
    handleSubmit,
    resetForm,
  } = useCreateScriptForm({ subject, onCreated })

  return (
    <Dialog
      title={UI_STRINGS.scripts.uploadModal.title}
      triggerButtonProps={{ children: triggerLabel, className: 'button solid' }}
      onClose={resetForm}
      closeOnOutsideClick={!isBusy}
      closeOnEsc={!isBusy}
    >
      <FormContainer onSubmit={handleSubmit}>
        <Card.Body className='ui-stack gap-4'>
          {/* TODO: swap for the project's real Portable Text editor — plain
              textareas are structural placeholders for title/description */}
          <Box className='ui-stack gap-1'>
            <label className='ui-label' htmlFor='script-title'>
              {UI_STRINGS.scripts.uploadModal.formTitle}
            </label>
            <textarea
              id='script-title'
              value={titleText}
              onChange={(event) => setTitleText(event.target.value)}
              disabled={isBusy}
              className='ui-card p-2 w-full'
              rows={2}
            />
          </Box>

          <Box className='ui-stack gap-1'>
            <label className='ui-label' htmlFor='script-description'>
              {UI_STRINGS.scripts.uploadModal.formDescription}
            </label>
            <textarea
              id='script-description'
              value={descriptionText}
              onChange={(event) => setDescriptionText(event.target.value)}
              disabled={isBusy}
              className='ui-card p-2 w-full'
              rows={3}
            />
          </Box>

          <Box className='ui-cluster gap-3'>
            <SubjectCard {...subject} />

            <Select
              className='w-auto h-full bg-background-200'
              defaultOption={professors?.[0]}
              options={professors}
              setSelectedValue={(value) => setProfessorId(value)}
              triggerProps={{
                'aria-label': UI_STRINGS.scripts.uploadModal.triggerLabel,
                className:
                  'button ghost min-w-36 rounded-lg border border-grey-300 px-3 py-2 ui-caption',
              }}
              icon={<User />}
            />
          </Box>

          <Box className='ui-stack gap-1'>
            <Select<SubjectExamSession>
              id='script-exam-session'
              className='w-auto h-full bg-background-200'
              defaultOption={examSessions[0]}
              options={examSessions}
              setSelectedValue={(value) => setExamSession(value)}
              triggerProps={{
                'aria-label': UI_STRINGS.scripts.uploadModal.examSessionLabel,
                className:
                  'button ghost min-w-36 rounded-lg border border-grey-300 px-3 py-2 ui-caption',
              }}
              icon={<DocumentPdf />}
            />
          </Box>

          <Box className='ui-stack gap-2'>
            {readingLinks.map((link, index) => (
              <Box key={index} className='ui-cluster gap-2'>
                <InputWrapper
                  label={UI_STRINGS.scripts.uploadModal.additionalReadingLabel}
                  inputProps={{
                    type: 'url',
                    placeholder: 'https://...',
                  }}
                  inputVal={link}
                  inputOnChange={(event) =>
                    updateReadingLink(index, event.target.value)
                  }
                  inputClearButton={true}
                  inputOnClear={() => updateReadingLink(index, '')}
                  disabled={isBusy}
                />
                <Button
                  onClick={() => removeReadingLink(index)}
                  disabled={isBusy}
                  className='button ghost'
                  aria-label='Remove link'
                >
                  {UI_STRINGS.scripts.uploadModal.removeButtonLabel}
                </Button>
              </Box>
            ))}
            <Button
              onClick={addReadingLink}
              disabled={isBusy}
              className='button subtle'
            >
              {UI_STRINGS.scripts.uploadModal.addLinkButtonLabel}
            </Button>
          </Box>

          <Box className='ui-stack gap-2'>
            <InputWrapper
              label={UI_STRINGS.scripts.uploadModal.filesLabel}
              inputProps={{
                type: 'url',
                placeholder: 'https://...',
                onDragOver: (event) => event.preventDefault(),
                onDrop: (event) => {
                  event.preventDefault()
                  addFiles(event.dataTransfer.files)
                },
                accept: ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(','),
              }}
              inputOnChange={(event) => addFiles(event.target.files)}
              inputClearButton={true}
              inputOnClear={clearFiles}
              disabled={isBusy}
            />
            {files.length > 0 && (
              <Box className='ui-stack gap-1'>
                {files.map((entry, index) => (
                  <FileRow
                    key={index}
                    entry={entry}
                    onRemove={() => removeFile(index)}
                    disabled={isBusy}
                  />
                ))}
              </Box>
            )}
          </Box>

          {isBusy && (
            <Text className='ui-caption'>
              {uploadState.status === 'uploading'
                ? UI_STRINGS.scripts.uploadModal.statuses.uploading
                : UI_STRINGS.scripts.uploadModal.statuses.creating}
            </Text>
          )}

          {uploadState.status === 'error' && (
            <Text className='ui-caption text-danger-600'>
              {uploadState.message}
            </Text>
          )}

          {uploadState.status === 'success' && (
            <Text className='ui-caption text-success-600'>
              {UI_STRINGS.scripts.uploadModal.statuses.success}
            </Text>
          )}
        </Card.Body>

        <Card.Footer className='ui-cluster gap-2 justify-end'>
          <Button
            onClick={resetForm}
            disabled={isBusy}
            className='button subtle'
          >
            {UI_STRINGS.scripts.uploadModal.cancelButtonLabel}
          </Button>
          <Button type='submit' disabled={!canSubmit} className='button solid'>
            {UI_STRINGS.scripts.uploadModal.submitButtonLabel}
          </Button>
        </Card.Footer>
      </FormContainer>
    </Dialog>
  )
}

/** One row in the not-yet-uploaded files list: name, size, any validation
 * error, a Preview trigger when the extension is a previewable type, and
 * Remove. Split out since it now owns real branching logic (the preview
 * gate) rather than being a one-line map body. */
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
    <Box className='ui-cluster gap-2 items-center justify-between'>
      <Box className='ui-cluster gap-2 items-center'>
        <Text className='ui-caption'>{entry.file.name}</Text>
        <Text className='ui-caption'>{formatFileSize(entry.file.size)}</Text>
        {entry.error && (
          <Text className={cn('ui-caption', 'text-danger-600')}>
            {entry.error}
          </Text>
        )}
      </Box>
      <Box className='ui-cluster gap-2 items-center'>
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
          className='button ghost'
          aria-label={`Remove ${entry.file.name}`}
        >
          {UI_STRINGS.scripts.uploadModal.removeButtonLabel}
        </Button>
      </Box>
    </Box>
  )
}
