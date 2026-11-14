'use client'

import { SCRIPT_STRINGS_PACK } from '@shared/strings/scripts-strings'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Divider } from '@/components/ui/Divider'
import { useEditScriptForm } from '@/hooks/useEditScriptForm'
import { useStrings } from '@/providers/locale/use-strings'
import type { EditScriptModalProps } from '@/types/components/ScriptManage.types'
import { ScriptDetailsFields } from '../form/ScriptDetailsFields'
import { ScriptFormDialog } from '../form/ScriptFormDialog'
import { ScriptSessionYearFields } from '../form/ScriptSessionYearFields'
import { SCRIPT_FORM_COLUMNS_CLASS } from '../form/script-form-layout'
import { ReadingLinksField } from '../ReadingLinksField'
import { ScriptFilesInput } from '../ScriptFilesInput'

/** Trigger plus the edit dialog. The dialog (and its form state) is only
 * mounted while open, so every opening starts from the saved values. */
export function EditScriptModal({
  scriptId,
  subjectId,
  script,
}: EditScriptModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const strings = useStrings(SCRIPT_STRINGS_PACK)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className='button button-sm hollow grow'
      >
        {strings.manage.edit}
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

/**
 * The edit dialog. It renders the same shell and sections as the create dialog
 * — only the model behind them differs (`useEditScriptForm` saves a `PATCH`
 * and appends files instead of creating a script).
 */
function EditScriptDialog({
  scriptId,
  subjectId,
  script,
  onClose,
}: EditScriptModalProps & { onClose: () => void }) {
  const strings = useStrings(SCRIPT_STRINGS_PACK)
  const form = useEditScriptForm({
    scriptId,
    subjectId,
    script,
    onSaved: onClose,
  })

  return (
    <ScriptFormDialog
      title={strings.manage.editDialogTitle}
      isOpen
      onClose={onClose}
      onSecondaryAction={onClose}
      secondaryActionLabel={strings.manage.cancel}
      submitLabel={strings.manage.save}
      onSubmit={form.handleSubmit}
      isBusy={form.isBusy}
      submitDisabled={form.submitDisabled}
    >
      <ScriptDetailsFields
        fields={form.textFields}
        resetKey='edit'
        slug={script.slug}
      />

      <Divider />

      <Box className={SCRIPT_FORM_COLUMNS_CLASS}>
        <ReadingLinksField
          {...form.readingLinks.fieldProps}
          disabled={form.isBusy}
        />

        <ScriptSessionYearFields
          fields={form.sessionFields}
          resetKey='edit'
          disabled={form.isBusy}
        />
      </Box>

      <Divider />

      <ScriptFilesInput
        files={form.files.files}
        disabled={form.isBusy}
        note={strings.manage.addFilesNote}
        onAdd={form.files.addFiles}
        onRemove={form.files.removeFile}
      />
    </ScriptFormDialog>
  )
}
