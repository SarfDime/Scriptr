'use client'

import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { useEditScriptForm } from '@/hooks/useEditScriptForm'
import type { EditScriptModalProps } from '@/types/components/ScriptManage.types'
import { ScriptDetailsFields } from '../form/ScriptDetailsFields'
import { ScriptFormDialog } from '../form/ScriptFormDialog'
import { ScriptSessionYearFields } from '../form/ScriptSessionYearFields'
import {
  SCRIPT_FORM_COLUMNS_CLASS,
  SCRIPT_FORM_FILES_CLASS,
} from '../form/script-form-layout'
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
  const form = useEditScriptForm({
    scriptId,
    subjectId,
    script,
    onSaved: onClose,
  })

  return (
    <ScriptFormDialog
      title={SCRIPT_STRINGS.manage.editDialogTitle}
      isOpen
      onClose={onClose}
      onSecondaryAction={onClose}
      secondaryActionLabel={SCRIPT_STRINGS.manage.cancel}
      submitLabel={SCRIPT_STRINGS.manage.save}
      onSubmit={form.handleSubmit}
      isBusy={form.isBusy}
      canSubmit={form.canSubmit}
    >
      <ScriptDetailsFields fields={form.textFields} resetKey='edit' />

      <Box className={SCRIPT_FORM_COLUMNS_CLASS}>
        <Box className='min-w-0'>
          <ReadingLinksField
            {...form.readingLinks.fieldProps}
            disabled={form.isBusy}
          />
        </Box>

        <Box className='ui-stack min-w-0 gap-5'>
          <ScriptSessionYearFields
            fields={form.sessionFields}
            resetKey='edit'
            disabled={form.isBusy}
          />
        </Box>
      </Box>

      <ScriptFilesInput
        files={form.files.files}
        disabled={form.isBusy}
        note={SCRIPT_STRINGS.manage.addFilesNote}
        onAdd={form.files.addFiles}
        onRemove={form.files.removeFile}
        fieldProps={{ className: SCRIPT_FORM_FILES_CLASS }}
      />
    </ScriptFormDialog>
  )
}
