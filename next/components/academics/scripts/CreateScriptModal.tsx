'use client'

import AddCircle from '@sanity/icons/AddCircle'
import DocumentPdf from '@sanity/icons/DocumentPdf'
import User from '@sanity/icons/User'
import { UI_STRINGS } from '@shared/config/strings'
import type { SubjectExamSession } from '@shared/types/academic.types'
import { getReadingLinkErrors } from '@shared/utils/link-utils'
import { portableTextToPlainText } from '@shared/utils/portable-text.utils'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SubjectCard } from '@/components/academics/subject/SubjectCard'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { FormContainer } from '@/components/typography/FormContainer'
import { RESTRICTED_EDITOR_OPTIONS } from '@/components/typography/portable-text/toolbar/editor-options'
import type { TextProps } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/field/Field'
import { Select } from '@/components/ui/select/Select'
import { useCreateScriptForm } from '@/hooks/useCreateScriptForm'
import { useDeviceType } from '@/hooks/useDeviceType'
import { useReadingLinkTouched } from '@/hooks/useReadingLinkTouched'
import { useRequireSignIn } from '@/hooks/useRequireSignIn'
import { useLoading } from '@/providers/loading/LoadingProvider'
import type { MinimalSubject } from '@/types/academics/subject.types'
import { ReadingLinksField } from './ReadingLinksField'
import { ScriptFilesInput } from './ScriptFilesInput'

/** Names the loader task this dialog owns, so it can be released on unmount. */
const UPLOAD_TASK_KEY = 'script-upload'

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
  // Which reading rows the user has left; errors only show for these so a
  // half-typed URL isn't flagged while typing.
  const linkTouched = useReadingLinkTouched()
  const [titleTouched, setTitleTouched] = useState(false)
  const [descriptionTouched, setDescriptionTouched] = useState(false)

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
    busyStage,
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

  // The upload, optimizing and saving all happen behind the global loader:
  // nothing on the page is reachable while it is up, so the dialog behind it
  // does not need a spinner of its own.
  const { startTask, finishTask } = useLoading()
  useEffect(() => {
    if (busyStage === null) return undefined
    startTask(UPLOAD_TASK_KEY, {
      message: UI_STRINGS.scripts.uploadModal.statuses[busyStage],
      hint: `${UI_STRINGS.scripts.uploadModal.progress.qualityWarning} ${UI_STRINGS.scripts.uploadModal.progress.qualityAdvice}`,
    })
    return () => finishTask(UPLOAD_TASK_KEY)
  }, [busyStage, startTask, finishTask])

  function resetTouched() {
    linkTouched.reset()
    setTitleTouched(false)
    setDescriptionTouched(false)
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
  const hasLinkErrors = getReadingLinkErrors(readingLinks).some(
    (error) => error !== null
  )

  // Removing a row shifts every later index down by one.
  const handleRemoveLink = (index: number) => {
    removeReadingLink(index)
    linkTouched.forgetRemoved(index)
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
      linkTouched.touchAll(readingLinks.length)
      setTitleTouched(true)
      setDescriptionTouched(true)
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
        className='button solid gap-1 p-2 md:grow-0 grow'
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
                  editorOptions={RESTRICTED_EDITOR_OPTIONS}
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
                  editorOptions={{
                    excludedStyles: ['h1', 'h2', 'h3'],
                    excludedColors: RESTRICTED_EDITOR_OPTIONS.excludedColors,
                  }}
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
                <ReadingLinksField
                  links={readingLinks}
                  touched={linkTouched.touched}
                  disabled={isBusy}
                  onAdd={addReadingLink}
                  onChange={updateReadingLink}
                  onRemove={handleRemoveLink}
                  onTouch={linkTouched.touch}
                />
              </Box>

              <Box className='min-w-0 md:border-grey-200 md:border-l md:pl-5'>
                <ScriptFilesInput
                  files={files}
                  disabled={isBusy}
                  onAdd={addFiles}
                  onRemove={removeFile}
                />
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
