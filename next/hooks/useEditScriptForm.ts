'use client'

import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import type { ScriptUpdateInput } from '@shared/types/scripts.types'
import { isExamSession } from '@shared/utils/script-session.utils'
import { useRouter } from 'next/navigation'
import { type SubmitEvent, useState } from 'react'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import { useScriptFilePicker } from '@/hooks/useScriptFilePicker'
import { useScriptFormLoader } from '@/hooks/useScriptFormLoader'
import { useScriptReadingLinks } from '@/hooks/useScriptReadingLinks'
import { useScriptSessionFields } from '@/hooks/useScriptSessionFields'
import { useScriptTextFields } from '@/hooks/useScriptTextFields'
import {
  addScriptFiles,
  type UploadStage,
  updateScript,
} from '@/lib/api/scripts-api'
import { useToast } from '@/providers/toaster/ToasterProvider'
import type { EditScriptModalProps } from '@/types/components/ScriptManage.types'

/** Names the loader task this dialog owns, so it can be released on unmount. */
const ADD_FILES_TASK_KEY = 'script-add-files'

/**
 * The edit form's model: the same shared field hooks the create form uses,
 * plus the edit-only parts — the `PATCH` that saves the fields and the upload
 * that appends new files, each reported separately.
 *
 * The dialog is mounted only while open, so the initial values are read once
 * and every opening starts from what is saved.
 */
export function useEditScriptForm({
  scriptId,
  subjectId,
  script,
  onSaved,
}: EditScriptModalProps & { onSaved: () => void }) {
  const router = useRouter()
  const { addToast } = useToast()
  const { run: runUpdate, state: updateState } = useProtectedAction(
    updateScript,
    { errorTitle: SCRIPT_STRINGS.manage.saveFailed }
  )
  const { run: runAddFiles, state: addFilesState } = useProtectedAction(
    addScriptFiles,
    { errorTitle: SCRIPT_STRINGS.manage.addFilesFailed }
  )
  const files = useScriptFilePicker()
  // Attaching files uploads and optimizes them first, which can take a while.
  const [uploadStage, setUploadStage] = useState<UploadStage>('uploading')

  const textFields = useScriptTextFields({
    title: script.title,
    description: script.description ?? [],
  })
  // A script saved before sessions existed has no session; an unknown legacy
  // value is shown as "general" rather than blocking the edit.
  const sessionFields = useScriptSessionFields({
    session: isExamSession(script.exam_session) ? script.exam_session : null,
    isChosen: script.exam_session !== null,
    year: script.exam_year,
  })
  const readingLinks = useScriptReadingLinks(script.additional_reading)

  const isAddingFiles = addFilesState.status === 'pending'
  const isBusy = updateState.status === 'pending' || isAddingFiles
  useScriptFormLoader(ADD_FILES_TASK_KEY, isAddingFiles ? uploadStage : null)

  // An emptied description is sent as `null`, which clears it.
  const payload: ScriptUpdateInput = {
    title: textFields.title,
    description: textFields.descriptionHasContent
      ? textFields.description
      : null,
    additional_reading: readingLinks.toPayload(),
    exam_session: sessionFields.session,
    exam_year: sessionFields.year,
  }
  // What is saved on the server right now. It moves forward once the text part
  // saves, so retrying after a failed file upload doesn't re-send it.
  const [baseline, setBaseline] = useState<ScriptUpdateInput>(payload)
  const hasFieldChanges = JSON.stringify(payload) !== JSON.stringify(baseline)
  const hasNewFiles = files.validFiles.length > 0

  const canSubmit =
    !isBusy &&
    textFields.isValid &&
    !readingLinks.hasErrors &&
    (hasFieldChanges || hasNewFiles)

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) {
      // Surface every validation error instead of silently doing nothing.
      textFields.touchAll()
      readingLinks.touchAll()
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
        files.validFiles.map((entry) => entry.file),
        setUploadStage
      )
      if (!result.ok) return
      files.clearFiles()
      router.refresh()
    }

    addToast({ type: 'success', title: SCRIPT_STRINGS.manage.saved })
    onSaved()
  }

  return {
    textFields,
    sessionFields,
    readingLinks,
    files,
    isBusy,
    canSubmit,
    handleSubmit,
  }
}

export type UseEditScriptFormReturn = ReturnType<typeof useEditScriptForm>
