'use client'

import type { SubmitEvent } from 'react'
import { useState } from 'react'
import { useScriptFilePicker } from '@/hooks/useScriptFilePicker'
import { useScriptFormLoader } from '@/hooks/useScriptFormLoader'
import { useScriptReadingLinks } from '@/hooks/useScriptReadingLinks'
import {
  type ScriptSessionValues,
  useScriptSessionFields,
} from '@/hooks/useScriptSessionFields'
import { useScriptUpload } from '@/hooks/useScriptsUpload'
import {
  type ScriptTextValues,
  useScriptTextFields,
} from '@/hooks/useScriptTextFields'
import type { MinimalSubject } from '@/types/academics/subject.types'
import type { SelectOptionType } from '@/types/components/Select.types'

/** Names the loader task this dialog owns, so it can be released on unmount. */
const UPLOAD_TASK_KEY = 'script-upload'

/** A pristine create form: nothing picked, nothing typed. */
const EMPTY_TEXT: ScriptTextValues = { title: {}, description: {} }
const EMPTY_SESSION: ScriptSessionValues = {
  session: null,
  isChosen: false,
  year: null,
}

export type UseCreateScriptFormArgs = {
  subject: MinimalSubject
  onCreated?: (scriptId: string) => void
}

/**
 * The create form's model: the shared field hooks (text, session/year, reading
 * links, files) plus the create-only parts — the fixed subject's professor
 * picker and the upload that turns the fields into a script record.
 *
 * The upload itself stays delegated to `useScriptUpload`; this hook only shapes
 * the form into its input.
 */
export function useCreateScriptForm({
  subject,
  onCreated,
}: UseCreateScriptFormArgs) {
  const { state, upload, reset: resetUpload } = useScriptUpload()

  const subjectId = subject.dbId ?? ''
  // A professor without a `dbId` has no row in Postgres, so the API has nothing
  // to assign it to. Offering it anyway is what made the picker show a phantom
  // selection: `String(null)` became the option value, `professorId` stayed
  // empty, and the form looked ready while submitting no professor at all. Such
  // an option is listed as disabled instead — visible, unpickable, and never
  // the default.
  const professors: Array<SelectOptionType> = subject.professors.map(
    (professor) => ({
      id: String(professor._id),
      value: professor.dbId ? String(professor.dbId) : '',
      label: professor.name,
      disabled: !professor.dbId,
    })
  )
  const defaultProfessor = professors.find((option) => !option.disabled)
  const [professorId, setProfessorId] = useState(
    () => defaultProfessor?.value ?? ''
  )

  const textFields = useScriptTextFields(EMPTY_TEXT)
  const sessionFields = useScriptSessionFields(EMPTY_SESSION)
  const readingLinks = useScriptReadingLinks([])
  const files = useScriptFilePicker()

  const busyStage =
    state.status === 'uploading' ||
    state.status === 'optimizing' ||
    state.status === 'creating'
      ? state.status
      : null
  const isBusy = busyStage !== null
  useScriptFormLoader(UPLOAD_TASK_KEY, busyStage)

  const canSubmit =
    !isBusy &&
    textFields.isValid &&
    subjectId.length > 0 &&
    professorId.length > 0 &&
    sessionFields.isChosen
  // Only busy work disables the button: an invalid form stays clickable so the
  // click can point at every missing field (see `handleSubmit`).
  const submitDisabled = isBusy

  function resetForm() {
    textFields.reset(EMPTY_TEXT)
    sessionFields.reset(EMPTY_SESSION)
    readingLinks.reset()
    files.clearFiles()
    setProfessorId(defaultProfessor?.value ?? '')
    resetUpload()
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) {
      // Surface every validation error instead of silently doing nothing.
      textFields.touchAll()
      readingLinks.touchAll()
      sessionFields.touchAll()
      return
    }

    const scriptId = await upload({
      title: textFields.titlePayload,
      description: textFields.descriptionPayload ?? undefined,
      subjectId,
      professorId,
      examSession: sessionFields.session,
      examYear: sessionFields.year,
      additionalReading: readingLinks.toPayload(),
      files: files.validFiles.map((entry) => entry.file),
    })

    if (!scriptId) return

    resetForm()
    onCreated?.(scriptId)
  }

  return {
    subjectId,
    professors,
    professorId,
    setProfessorId,
    textFields,
    sessionFields,
    readingLinks,
    files,
    isBusy,
    busyStage,
    canSubmit,
    submitDisabled,
    handleSubmit,
    reset: resetForm,
  }
}

export type UseCreateScriptFormReturn = ReturnType<typeof useCreateScriptForm>
