'use client'

import AddCircle from '@sanity/icons/AddCircle'
import User from '@sanity/icons/User'
import { canWriteInStudy } from '@shared/utils/api.utils'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SubjectCard } from '@/components/academics/subject/SubjectCard'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Divider } from '@/components/ui/Divider'
import { Field } from '@/components/ui/field/Field'
import { Select } from '@/components/ui/select/Select'
import { useCreateScriptForm } from '@/hooks/useCreateScriptForm'
import { useRequireSignIn } from '@/hooks/useRequireSignIn'
import { useUIStrings } from '@/providers/locale/use-strings'
import { useSession } from '@/providers/SessionProvider'
import { useStudySetupModal } from '@/providers/StudySetupModalProvider'
import type { MinimalSubject } from '@/types/academics/subject.types'
import { ScriptDetailsFields } from './form/ScriptDetailsFields'
import { ScriptFormDialog } from './form/ScriptFormDialog'
import { ScriptSessionYearFields } from './form/ScriptSessionYearFields'
import {
  SCRIPT_FIELD_LABEL_PROPS,
  SCRIPT_FORM_COLUMNS_CLASS,
} from './form/script-form-layout'
import { ReadingLinksField } from './ReadingLinksField'
import { ScriptFilesInput } from './ScriptFilesInput'

export type CreateScriptModalProps = {
  subject: MinimalSubject
  /** The study's database id: writing in it needs a profile for it, and a
   * reader without one is sent to setup before the form opens. */
  studyId?: string | null
  onCreated?: (scriptId: string) => void
  triggerLabel?: string
}

/**
 * Create-script modal. The form model lives in `useCreateScriptForm` and the
 * dialog chrome in `ScriptFormDialog` — both shared with the edit dialog — so
 * this component only wires the trigger and lays out the sections.
 */
export function CreateScriptModal({
  subject,
  studyId,
  onCreated,
  triggerLabel,
}: CreateScriptModalProps) {
  const ui = useUIStrings()
  const router = useRouter()
  const requireSignIn = useRequireSignIn()
  const { session } = useSession()
  const { openStudySetupModal } = useStudySetupModal()
  const [isOpen, setIsOpen] = useState(false)
  // Bumped on clear and after a successful upload, remounting the uncontrolled
  // editors and pickers so they start from the reset values.
  const [formKey, setFormKey] = useState(0)

  const form = useCreateScriptForm({
    subject,
    onCreated: (scriptId) => {
      setFormKey((current) => current + 1)
      setIsOpen(false)
      router.refresh()
      onCreated?.(scriptId)
    },
  })

  const handleClear = () => {
    form.reset()
    setFormKey((current) => current + 1)
  }

  // The API refuses a script in a study the reader has no profile for, and
  // that refusal only surfaces after the files are uploaded — so it is checked
  // on the way in. A session still loading is left to the server.
  const handleOpen = () => {
    if (!requireSignIn()) return
    if (
      studyId &&
      session.status === 'authenticated' &&
      !canWriteInStudy(session.user, studyId)
    ) {
      openStudySetupModal(subject.study?.siteSlug)
      return
    }
    setIsOpen(true)
  }

  // Only a linked professor can be assigned, so "has one" means "has a
  // selectable one" — with every professor unlinked the field says so instead of
  // looking filled in.
  const selectableProfessors = form.professors.filter(
    (option) => !option.disabled
  )
  const hasProfessors = selectableProfessors.length > 0
  const hasProfessorOptions = form.professors.length > 0
  // A single professor is already the assigned one: nothing to pick, so the
  // picker is shown but locked.
  const isProfessorFixed = selectableProfessors.length <= 1

  return (
    <>
      <Button
        onClick={handleOpen}
        className='button solid button-sm h-10 gap-1 md:grow-0 grow'
      >
        <AddCircle />
        {triggerLabel ?? ui.scripts.uploadModal.triggerLabel}
      </Button>

      <ScriptFormDialog
        title={ui.scripts.uploadModal.title}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSecondaryAction={handleClear}
        secondaryActionLabel={ui.scripts.uploadModal.cancelButtonLabel}
        submitLabel={ui.scripts.uploadModal.submitButtonLabel}
        onSubmit={form.handleSubmit}
        isBusy={form.isBusy}
        submitDisabled={form.submitDisabled}
      >
        <ScriptDetailsFields fields={form.textFields} resetKey={formKey} />

        <Divider />

        <Box className={SCRIPT_FORM_COLUMNS_CLASS}>
          {/* Fixed by the page, nothing to validate. */}
          <Field
            className='min-w-0'
            grouped
            label={ui.scripts.uploadModal.subjectLabel}
            labelProps={SCRIPT_FIELD_LABEL_PROPS}
          >
            <SubjectCard {...subject} />
            <Divider className='my-2' />
            <ReadingLinksField
              {...form.readingLinks.fieldProps}
              disabled={form.isBusy}
            />
          </Field>

          <Box className='ui-stack min-w-0 gap-5'>
            <Field
              className='min-w-0'
              label={ui.scripts.uploadModal.professorLabel}
              labelProps={SCRIPT_FIELD_LABEL_PROPS}
              errorText={
                hasProfessorOptions
                  ? ui.scripts.uploadModal.fieldErrors.professorsUnavailable
                  : ui.scripts.uploadModal.fieldErrors.noProfessors
              }
              required
              valid={hasProfessors}
              invalid={!hasProfessors}
            >
              <Select
                // Remounted on clear so it shows the reset professor again.
                key={`professor-${formKey}`}
                className='w-full'
                disabled={isProfessorFixed}
                // Read back from the form's value, so the trigger cannot show a
                // professor the form is not actually submitting.
                defaultOption={form.professors.find(
                  // Only a selectable option can equal the form's value; the
                  // unlinked ones all carry an empty value, so matching on the
                  // value alone would show one of them.
                  (option) =>
                    !option.disabled && option.value === form.professorId
                )}
                options={form.professors}
                setSelectedValue={form.setProfessorId}
                triggerProps={{
                  'aria-label': ui.scripts.uploadModal.professorLabel,
                }}
                icon={<User />}
              />
            </Field>

            <ScriptSessionYearFields
              fields={form.sessionFields}
              resetKey={formKey}
              disabled={form.isBusy}
              required
            />
          </Box>
        </Box>

        <Divider />

        <ScriptFilesInput
          files={form.files.files}
          disabled={form.isBusy}
          onAdd={form.files.addFiles}
          onRemove={form.files.removeFile}
        />
      </ScriptFormDialog>
    </>
  )
}
