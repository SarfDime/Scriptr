'use client'

import { PORTABLE_TEXT_LIMITS } from '@shared/config/portable-text-limits'
import { UI_STRINGS } from '@shared/config/strings'
import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { ScriptUpdateInput } from '@shared/types/scripts.types'
import { getReadingLinkErrors } from '@shared/utils/link-utils'
import {
  isScriptDescriptionPortableTextValue,
  isScriptTitlePortableTextValue,
  portableTextJsonByteLength,
  portableTextToPlainText,
} from '@shared/utils/portable-text.utils'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { type SubmitEvent, useEffect, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { FormContainer } from '@/components/typography/FormContainer'
import { RESTRICTED_EDITOR_OPTIONS } from '@/components/typography/portable-text/toolbar/editor-options'
import type { TextProps } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/field/Field'
import { useDeviceType } from '@/hooks/useDeviceType'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import { useReadingLinkTouched } from '@/hooks/useReadingLinkTouched'
import { useScriptFilePicker } from '@/hooks/useScriptFilePicker'
import {
  addScriptFiles,
  type UploadStage,
  updateScript,
} from '@/lib/api/scripts-api'
import { useLoading } from '@/providers/loading/LoadingProvider'
import { useToast } from '@/providers/toaster/ToasterProvider'

const ADD_FILES_TASK_KEY = 'script-add-files'

import type { EditScriptModalProps } from '@/types/components/ScriptManage.types'
import { ReadingLinksField } from '../ReadingLinksField'
import { ScriptFilesInput } from '../ScriptFilesInput'

const PortableTextEditorSection = dynamic(
  () =>
    import(
      '@/components/typography/portable-text/PortableTextEditorSection'
    ).then((module) => module.PortableTextEditorSection),
  { ssr: false }
)

const FIELD_LABEL_PROPS: TextProps = { className: 'text-base font-semibold' }

/** Trigger plus the edit dialog. The dialog (and its form state) is only
 * mounted while open, so every opening starts from the saved values and
 * there is no reset logic to keep in sync. */
export function EditScriptModal({
  scriptId,
  subjectId,
  script,
}: EditScriptModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className='button button-sm hollow grow'
      >
        {SCRIPT_STRINGS.manage.edit}
      </Button>
      {isOpen && (
        <EditScriptDialog
          scriptId={scriptId}
          subjectId={subjectId}
          script={script}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

/** Edits the three fields `PATCH /scripts/:id` accepts and adds new files.
 * Validation and size limits are the same ones the create form and the API
 * use. Removing an existing file stays on the script page. */
function EditScriptDialog({
  scriptId,
  subjectId,
  script,
  onClose,
}: EditScriptModalProps & { onClose: () => void }) {
  const router = useRouter()
  const isMobile = useDeviceType() === 'mobile'
  const { addToast } = useToast()
  const { run: runUpdate, state: updateState } = useProtectedAction(
    updateScript,
    { errorTitle: SCRIPT_STRINGS.manage.saveFailed }
  )
  const { run: runAddFiles, state: addFilesState } = useProtectedAction(
    addScriptFiles,
    { errorTitle: SCRIPT_STRINGS.manage.addFilesFailed }
  )
  const picker = useScriptFilePicker()
  // Attaching files uploads and optimizes them first, which can take a while.
  const [uploadStage, setUploadStage] = useState<UploadStage>('uploading')
  const [title, setTitle] = useState<PortableTextValue>(script.title)
  const [description, setDescription] = useState<PortableTextValue>(
    script.description ?? []
  )
  const [readingLinks, setReadingLinks] = useState<Array<string>>(
    script.additional_reading
  )
  // What is saved on the server right now. It moves forward once the text
  // part saves, so retrying after a failed file upload doesn't re-send it.
  const [baseline, setBaseline] = useState<ScriptUpdateInput>({
    title: script.title,
    description: script.description,
    additional_reading: script.additional_reading,
  })
  const [titleTouched, setTitleTouched] = useState(false)
  const linkTouched = useReadingLinkTouched()

  const isBusy =
    updateState.status === 'pending' || addFilesState.status === 'pending'

  // The global loader covers the page while files upload and are optimized, so
  // nothing here needs a spinner of its own.
  const { startTask, finishTask } = useLoading()
  const isAddingFiles = addFilesState.status === 'pending'
  useEffect(() => {
    if (!isAddingFiles) return undefined
    startTask(ADD_FILES_TASK_KEY, {
      message: UI_STRINGS.scripts.uploadModal.statuses[uploadStage],
      hint: `${UI_STRINGS.scripts.uploadModal.progress.qualityWarning} ${UI_STRINGS.scripts.uploadModal.progress.qualityAdvice}`,
    })
    return () => finishTask(ADD_FILES_TASK_KEY)
  }, [isAddingFiles, uploadStage, startTask, finishTask])

  const titleHasContent = portableTextToPlainText(title).trim() !== ''
  const titleTooLong =
    portableTextJsonByteLength(title) > PORTABLE_TEXT_LIMITS.scriptTitleBytes
  const descriptionTooLong =
    portableTextJsonByteLength(description) >
    PORTABLE_TEXT_LIMITS.scriptDescriptionBytes
  const descriptionHasContent =
    portableTextToPlainText(description).trim() !== ''

  const hasLinkErrors = getReadingLinkErrors(readingLinks).some(
    (error) => error !== null
  )

  // An emptied description is sent as `null`, which clears it.
  const payload: ScriptUpdateInput = {
    title,
    description: descriptionHasContent ? description : null,
    additional_reading: readingLinks.map((link) => link.trim()).filter(Boolean),
  }
  const hasFieldChanges = JSON.stringify(payload) !== JSON.stringify(baseline)
  const hasNewFiles = picker.validFiles.length > 0

  const fieldsValid =
    titleHasContent &&
    !titleTooLong &&
    !descriptionTooLong &&
    isScriptTitlePortableTextValue(payload.title) &&
    (payload.description === null ||
      isScriptDescriptionPortableTextValue(payload.description)) &&
    !hasLinkErrors

  const canSubmit = !isBusy && fieldsValid && (hasFieldChanges || hasNewFiles)

  const updateReadingLink = (index: number, value: string) =>
    setReadingLinks((current) =>
      current.map((link, i) => (i === index ? value : link))
    )

  // Removing a row shifts every later index down by one.
  const removeReadingLink = (index: number) => {
    setReadingLinks((current) => current.filter((_, i) => i !== index))
    linkTouched.forgetRemoved(index)
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) {
      setTitleTouched(true)
      linkTouched.touchAll(readingLinks.length)
      return
    }

    // Restriction (403) and other failures are toasted by the hooks
    // themselves. Each step that succeeds refreshes the page, so closing the
    // dialog after a later failure never leaves stale values behind.
    if (hasFieldChanges) {
      const result = await runUpdate(scriptId, payload)
      if (!result.ok) return
      setBaseline(payload)
      router.refresh()
    }

    if (hasNewFiles) {
      const result = await runAddFiles(
        scriptId,
        subjectId,
        picker.validFiles.map((entry) => entry.file),
        setUploadStage
      )
      if (!result.ok) return
      picker.clearFiles()
      router.refresh()
    }

    addToast({ type: 'success', title: SCRIPT_STRINGS.manage.saved })
    onClose()
  }

  return (
    <Dialog
      title={SCRIPT_STRINGS.manage.editDialogTitle}
      hideTrigger
      isOpen
      onClose={onClose}
      dialogProps={{
        className:
          'overflow-hidden md:top-0 md:bottom-0 md:my-auto md:max-h-[90vh] md:max-w-3xl open:flex open:flex-col',
      }}
      closeOnOutsideClick={false}
      closeOnEsc={false}
      hideBackdrop={isMobile}
    >
      <FormContainer
        onSubmit={handleSubmit}
        className='flex min-h-0 flex-1 flex-col'
      >
        <Card.Body className='ui-stack min-h-0 flex-1 divide-y divide-grey-200 overflow-y-auto p-0 gap-0'>
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
              invalid={titleTouched && (!titleHasContent || titleTooLong)}
            >
              <PortableTextEditorSection
                initialContent={title}
                onChange={(value) => {
                  setTitleTouched(true)
                  setTitle(value)
                }}
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
              invalid={descriptionTooLong}
            >
              <PortableTextEditorSection
                initialContent={description}
                onChange={setDescription}
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

          <Box className='p-5'>
            <ReadingLinksField
              links={readingLinks}
              touched={linkTouched.touched}
              disabled={isBusy}
              onAdd={() => setReadingLinks((current) => [...current, ''])}
              onChange={updateReadingLink}
              onRemove={removeReadingLink}
              onTouch={linkTouched.touch}
            />
          </Box>

          <Box className='p-5'>
            <ScriptFilesInput
              files={picker.files}
              disabled={isBusy}
              note={SCRIPT_STRINGS.manage.addFilesNote}
              onAdd={picker.addFiles}
              onRemove={picker.removeFile}
            />
          </Box>
        </Card.Body>

        <Card.Footer className='ui-cluster shrink-0 justify-end gap-2 border-grey-200 border-t px-5 py-4'>
          <Button onClick={onClose} disabled={isBusy} className='button subtle'>
            {SCRIPT_STRINGS.manage.cancel}
          </Button>
          <Button type='submit' disabled={!canSubmit} className='button solid'>
            {SCRIPT_STRINGS.manage.save}
          </Button>
        </Card.Footer>
      </FormContainer>
    </Dialog>
  )
}
