'use client'

import AddCircle from '@sanity/icons/AddCircle'
import DocumentPdf from '@sanity/icons/DocumentPdf'
import User from '@sanity/icons/User'
import { ALLOWED_EXTENSIONS } from '@shared/config/shared-constants'
import { UI_STRINGS } from '@shared/config/strings'
import type { SubjectExamSession } from '@shared/types/academic.types'
import { getReadingLinkErrors } from '@shared/utils/link-utils'
import { portableTextToPlainText } from '@shared/utils/portable-text.utils'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SubjectCard } from '@/components/academics/subject/SubjectCard'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Text, type TextProps } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/field/Field'
import { Select } from '@/components/ui/select/Select'
import {
  type FileWithError,
  formatFileSize,
  useCreateScriptForm,
} from '@/hooks/useCreateScriptForm'
import { useDeviceType } from '@/hooks/useDeviceType'
import { useRequireSignIn } from '@/hooks/useRequireSignIn'
import { cn } from '@/lib/common-utils'
import { getFileTypeFromFilename, getPreviewableKind } from '@/lib/file-preview'
import type { MinimalSubject } from '@/types/academics/subject.types'
import { FilePreviewModal } from './FilePreviewModal'

const PortableTextEditorSection = dynamic(
  () =>
    import(
      '@/components/typography/portable-text/PortableTextEditorSection'
    ).then((module) => module.PortableTextEditorSection),
  { ssr: false }
)

const SELECT_TRIGGER_CLASS =
  'button button-sm ghost min-h-9 w-full rounded-md border border-grey-300 px-2.5 py-1.5'

const FIELD_LABEL_PROPS: TextProps = { className: 'text-base font-semibold' }

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
 *
 * Validation display: required fields (title, professor, files) are
 * `required` and only show `invalid` once the user has interacted with them,
 * so a pristine form isn't covered in errors. Additional-reading links use
 * the shared validator (the API applies the same rules); only the "touched"
 * display state lives here.
 */
export function CreateScriptModal({
  subject,
  onCreated,
  triggerLabel = UI_STRINGS.scripts.uploadModal.triggerLabel,
}: CreateScriptModalProps) {
  const router = useRouter()
  const isMobile = useDeviceType() === 'mobile'
  const requireSignIn = useRequireSignIn()
  const [isOpen, setIsOpen] = useState(false)
  // Bumped only on cancel/success so the uncontrolled editors remount with
  // fresh content. Keying on content length remounted them on every
  // keystroke, which dropped focus and the cursor.
  const [formKey, setFormKey] = useState(0)
  // Indices of reading links the user has left; errors only show for these so
  // a half-typed URL isn't flagged while typing.
  const [touchedLinks, setTouchedLinks] = useState<ReadonlySet<number>>(
    new Set()
  )
  const [titleTouched, setTitleTouched] = useState(false)
  const [descriptionTouched, setDescriptionTouched] = useState(false)
  const [filesTouched, setFilesTouched] = useState(false)

  const {
    title,
    setTitle,
    description,
    setDescription,
    setProfessorId,
    setExamSession,
    readingLinks,
    addReadingLink,
    updateReadingLink,
    removeReadingLink,
    files,
    addFiles,
    removeFile,
    isBusy,
    canSubmit,
    titleTooLong,
    descriptionTooLong,
    professors,
    examSessions,
    handleSubmit,
    resetForm,
  } = useCreateScriptForm({
    subject,
    onCreated: (scriptId) => {
      resetTouched()
      resetForm()
      setFormKey((current) => current + 1)
      setIsOpen(false)
      router.refresh()
      onCreated?.(scriptId)
    },
  })

  function resetTouched() {
    setTouchedLinks(new Set())
    setTitleTouched(false)
    setDescriptionTouched(false)
    setFilesTouched(false)
  }

  // --- Title (required) ---------------------------------------------------
  const titleHasContent = portableTextToPlainText(title).trim() !== ''
  const titleInvalid = titleTouched && (!titleHasContent || titleTooLong)

  const handleTitleChange = (value: Parameters<typeof setTitle>[0]) => {
    setTitleTouched(true)
    setTitle(value)
  }

  const handleDescriptionChange = (
    value: Parameters<typeof setDescription>[0]
  ) => {
    setDescriptionTouched(true)
    setDescription(value)
  }

  // --- Professor (required) -----------------------------------------------
  const hasProfessors = (professors?.length ?? 0) > 0

  // --- Additional reading (optional) --------------------------------------
  const linkErrors = getReadingLinkErrors(readingLinks)
  const hasLinkErrors = linkErrors.some((error) => error !== null)
  const hasVisibleLinkErrors = linkErrors.some(
    (error, index) => error !== null && touchedLinks.has(index)
  )
  const hasLinks = readingLinks.some((link) => link.trim() !== '')

  const markLinkTouched = (index: number) =>
    setTouchedLinks((current) => new Set(current).add(index))

  // Removing a row shifts every later index down by one.
  const handleRemoveLink = (index: number) => {
    removeReadingLink(index)
    setTouchedLinks(
      (current) =>
        new Set(
          [...current]
            .filter((touched) => touched !== index)
            .map((touched) => (touched > index ? touched - 1 : touched))
        )
    )
  }

  // --- Files (required, each must pass validation) -------------------------
  const hasFileErrors = files.some((entry) => entry.error !== null)
  const filesMissing = filesTouched && files.length === 0
  const filesInvalid = hasFileErrors || filesMissing
  const filesValid = files.length > 0 && !hasFileErrors

  const handleAddFiles = (list: FileList | null) => {
    setFilesTouched(true)
    addFiles(list)
  }

  const handleRemoveFile = (index: number) => {
    setFilesTouched(true)
    removeFile(index)
  }

  // --- Cancel / submit ----------------------------------------------------
  const handleCancel = () => {
    resetForm()
    resetTouched()
    setFormKey((current) => current + 1)
  }

  // Backstop for Enter-key submission: surface every error instead of
  // submitting.
  const handleGuardedSubmit = (event: Parameters<typeof handleSubmit>[0]) => {
    if (
      hasLinkErrors ||
      !titleHasContent ||
      titleTooLong ||
      descriptionTooLong
    ) {
      event.preventDefault()
      setTouchedLinks(new Set(readingLinks.map((_, index) => index)))
      setTitleTouched(true)
      setDescriptionTouched(true)
      setFilesTouched(true)
      return
    }
    return handleSubmit(event)
  }

  return (
    <>
      <Button
        onClick={() => {
          if (requireSignIn()) setIsOpen(true)
        }}
        className='button solid gap-1 p-2'
      >
        <AddCircle />
        {triggerLabel}
      </Button>
      <Dialog
        title={UI_STRINGS.scripts.uploadModal.title}
        hideTrigger
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        dialogProps={{
          className:
            'overflow-hidden md:top-0 md:bottom-0 md:my-auto md:max-h-[90vh] md:max-w-3xl open:flex open:flex-col',
        }}
        closeOnOutsideClick={false}
        closeOnEsc={false}
        hideBackdrop={isMobile}
      >
        <FormContainer
          onSubmit={handleGuardedSubmit}
          className='flex min-h-0 flex-1 flex-col'
        >
          <Card.Body className='ui-stack min-h-0 flex-1 divide-y divide-grey-200 overflow-y-auto p-0 gap-0'>
            {/* Details */}
            <Box className='ui-stack gap-5 p-5'>
              <Field
                className='min-w-0'
                label={UI_STRINGS.scripts.uploadModal.formTitle}
                labelProps={FIELD_LABEL_PROPS}
                helperText={UI_STRINGS.scripts.uploadModal.formTitleHelp}
                errorText={
                  titleTooLong
                    ? UI_STRINGS.scripts.uploadModal.fieldErrors.titleTooLong
                    : UI_STRINGS.scripts.uploadModal.fieldErrors.titleRequired
                }
                required
                valid={titleHasContent && !titleTooLong}
                invalid={titleInvalid}
              >
                <PortableTextEditorSection
                  key={`title-${formKey}`}
                  initialContent={title}
                  onChange={handleTitleChange}
                  showActions={false}
                  ariaLabel={UI_STRINGS.scripts.uploadModal.formTitle}
                  editorOptions={{
                    excludedStyles: [
                      'h1',
                      'h2',
                      'h3',
                      'h4',
                      'h5',
                      'base',
                      'h6',
                    ],
                    showStyles: false,
                    showLists: false,
                    showAlignment: false,
                  }}
                  editorClassName='h-10 min-h-0 overflow-hidden whitespace-nowrap p-2'
                  singleLine
                />
              </Field>

              <Field
                className='min-w-0'
                label={UI_STRINGS.scripts.uploadModal.formDescription}
                labelProps={FIELD_LABEL_PROPS}
                helperText={UI_STRINGS.scripts.uploadModal.formDescriptionHelp}
                errorText={
                  UI_STRINGS.scripts.uploadModal.fieldErrors.descriptionTooLong
                }
                invalid={descriptionTouched && descriptionTooLong}
              >
                <PortableTextEditorSection
                  key={`description-${formKey}`}
                  initialContent={description}
                  onChange={handleDescriptionChange}
                  showActions={false}
                  ariaLabel={UI_STRINGS.scripts.uploadModal.formDescription}
                  editorOptions={{ excludedStyles: ['h1', 'h2', 'h3'] }}
                  editorClassName='min-h-28'
                />
              </Field>
            </Box>

            {/* Classification */}
            <Box className='grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
              {/* Fixed by the page, nothing to validate. */}
              <Field
                className='min-w-0'
                label={UI_STRINGS.scripts.uploadModal.subjectLabel}
                labelProps={FIELD_LABEL_PROPS}
              >
                <SubjectCard {...subject} />
              </Field>

              <Box className='ui-stack min-w-0 gap-5'>
                <Field
                  className='min-w-0'
                  label={UI_STRINGS.scripts.uploadModal.professorLabel}
                  labelProps={FIELD_LABEL_PROPS}
                  errorText={
                    UI_STRINGS.scripts.uploadModal.fieldErrors.noProfessors
                  }
                  required
                  valid={hasProfessors}
                  invalid={!hasProfessors}
                >
                  <Select
                    className='w-full bg-background-200'
                    defaultOption={professors?.[0]}
                    options={professors}
                    setSelectedValue={(value) => setProfessorId(value)}
                    triggerProps={{
                      'aria-label':
                        UI_STRINGS.scripts.uploadModal.professorLabel,
                      className: SELECT_TRIGGER_CLASS,
                    }}
                    icon={<User />}
                  />
                </Field>

                {/* Optional with a default selected, nothing to validate. */}
                <Field
                  className='min-w-0'
                  label={UI_STRINGS.scripts.uploadModal.examSessionLabel}
                  labelProps={FIELD_LABEL_PROPS}
                  helperText={UI_STRINGS.scripts.uploadModal.examSessionHelp}
                >
                  <Select<SubjectExamSession>
                    id='script-exam-session'
                    className='w-full bg-background-200'
                    defaultOption={examSessions[0]}
                    options={examSessions}
                    setSelectedValue={(value) => setExamSession(value)}
                    triggerProps={{
                      'aria-label':
                        UI_STRINGS.scripts.uploadModal.examSessionLabel,
                      className: SELECT_TRIGGER_CLASS,
                    }}
                    icon={<DocumentPdf />}
                  />
                </Field>
              </Box>
            </Box>

            {/* Materials */}
            <Box className='grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-0'>
              <Box className='min-w-0 md:pr-5'>
                <Field
                  className='min-w-0'
                  label={UI_STRINGS.scripts.uploadModal.additionalReadingLabel}
                  labelProps={FIELD_LABEL_PROPS}
                  helperText={
                    UI_STRINGS.scripts.uploadModal.additionalReadingHelp
                  }
                  valid={hasLinks && !hasLinkErrors}
                  invalid={hasVisibleLinkErrors}
                >
                  <Box className='ui-stack gap-2'>
                    {readingLinks.map((link, index) => {
                      const touched = touchedLinks.has(index)
                      const errorCode = touched ? linkErrors[index] : null

                      return (
                        <InputWrapper
                          key={index}
                          valid={touched && link.trim() !== '' && !errorCode}
                          invalid={Boolean(errorCode)}
                          inputProps={{
                            type: 'url',
                            placeholder: 'https://...',
                            'aria-label':
                              UI_STRINGS.scripts.uploadModal
                                .additionalReadingLabel,
                            onBlur: () => markLinkTouched(index),
                          }}
                          errorText={
                            errorCode
                              ? UI_STRINGS.scripts.uploadModal
                                  .readingLinkErrors[errorCode]
                              : undefined
                          }
                          inputVal={link}
                          inputOnChange={(event) =>
                            updateReadingLink(index, event.target.value)
                          }
                          wrapperProps={{
                            className: cn('h-7 pl-0'),
                          }}
                          inputClearButton={true}
                          inputOnClear={() => updateReadingLink(index, '')}
                          disabled={isBusy}
                        >
                          <Button
                            onClick={() => handleRemoveLink(index)}
                            disabled={isBusy}
                            className='button button-sm danger mr-1 rounded-none'
                            aria-label='Remove link'
                          >
                            {UI_STRINGS.scripts.uploadModal.removeButtonLabel}
                          </Button>
                        </InputWrapper>
                      )
                    })}
                    <Button
                      onClick={addReadingLink}
                      disabled={isBusy}
                      className='button button-sm success self-start rounded-md'
                    >
                      {UI_STRINGS.scripts.uploadModal.addLinkButtonLabel}
                    </Button>
                  </Box>
                </Field>
              </Box>

              <Box className='min-w-0 md:border-grey-200 md:border-l md:pl-5'>
                {/* No label here: the dropzone carries its own title and help. */}
                <Field
                  className='min-w-0'
                  errorText={
                    hasFileErrors
                      ? UI_STRINGS.scripts.uploadModal.fieldErrors.filesInvalid
                      : UI_STRINGS.scripts.uploadModal.fieldErrors.filesRequired
                  }
                  required
                  valid={filesValid}
                  invalid={filesInvalid}
                >
                  <Box className='ui-stack gap-2'>
                    <FileDropzone
                      label={UI_STRINGS.scripts.uploadModal.filesLabel}
                      help={UI_STRINGS.scripts.uploadModal.filesHelp}
                      onFiles={handleAddFiles}
                      disabled={isBusy}
                      valid={filesValid}
                      invalid={filesInvalid}
                    />
                    {files.length > 0 && (
                      <Box className='ui-stack min-w-0 w-full gap-2'>
                        {files.map((entry, index) => (
                          <FileRow
                            key={`${entry.file.name}-${index}`}
                            entry={entry}
                            onRemove={() => handleRemoveFile(index)}
                            disabled={isBusy}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Field>
              </Box>
            </Box>
          </Card.Body>

          <Card.Footer className='ui-cluster shrink-0 justify-end gap-2 border-grey-200 border-t px-5 py-4'>
            <Button
              onClick={handleCancel}
              disabled={isBusy}
              className='button subtle'
            >
              {UI_STRINGS.scripts.uploadModal.cancelButtonLabel}
            </Button>
            <Button
              type='submit'
              disabled={!canSubmit || hasLinkErrors}
              className='button solid'
            >
              {UI_STRINGS.scripts.uploadModal.submitButtonLabel}
            </Button>
          </Card.Footer>
        </FormContainer>
      </Dialog>
    </>
  )
}

/** Drop target that doubles as the field's label: the title and help text
 * live inside the box, so the section needs no separate heading. The border
 * reflects validation state. */
function FileDropzone({
  label,
  help,
  onFiles,
  disabled,
  valid,
  invalid,
}: {
  label: string
  help: string
  onFiles: (files: FileList | null) => void
  disabled: boolean
  valid: boolean
  invalid: boolean
}) {
  const [isDragging, setIsDragging] = useState(false)

  const borderClass = (() => {
    if (isDragging) return 'border-brand border-solid'
    if (invalid) return 'border-danger-600'
    if (valid) return 'border-success-600'
    return 'border-grey-300'
  })()

  return (
    <Box className='relative'>
      <input
        id='script-files'
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
        htmlFor='script-files'
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
          'ui-stack cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed bg-background-200 px-2 py-3 text-center',
          'hover:border-brand-300 hover:bg-background-150 transition-colors',
          'peer-focus-visible:outline-2 peer-disabled:pointer-events-none peer-disabled:opacity-50',
          borderClass
        )}
      >
        <span className='text-base font-semibold'>{label}</span>
        <span className='ui-caption'>{help}</span>
      </label>
    </Box>
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
    <Box className='grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-grey-200 bg-background-200 p-1'>
      <Box className='ui-stack min-w-0 flex-1 gap-0.5 overflow-hidden'>
        <Text className='ui-caption block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap'>
          {entry.file.name}
        </Text>
        <Text className='ui-caption'>{formatFileSize(entry.file.size)}</Text>
        {entry.error && (
          <Text className='ui-caption text-danger-600'>{entry.error}</Text>
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
