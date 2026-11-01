'use client'

import type { SubmitEvent } from 'react'
import { useEffect, useEffectEvent, useState } from 'react'
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
const EMPTY_TEXT: ScriptTextValues = { title: [], description: [] }
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
  const professors: Array<SelectOptionType> = subject.professors.map(
    (professor) => ({
      id: String(professor._id),
      value: String(professor.dbId),
      label: professor.name,
    })
  )
  const [professorId, setProfessorId] = useState(
    () => subject.professors[0]?.dbId ?? ''
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

  function resetForm() {
    textFields.reset(EMPTY_TEXT)
    sessionFields.reset(EMPTY_SESSION)
    readingLinks.reset()
    files.clearFiles()
    setProfessorId(subject.professors[0]?.dbId ?? '')
    resetUpload()
  }

  // An effect event keeps the success handler on the latest closures without
  // making the effect depend on every setter it touches.
  const handleSuccess = useEffectEvent((scriptId: string) => {
    resetForm()
    onCreated?.(scriptId)
  })

  useEffect(() => {
    if (state.status === 'success') handleSuccess(state.scriptId)
  }, [state])

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) {
      // Surface every validation error instead of silently doing nothing.
      textFields.touchAll()
      readingLinks.touchAll()
      return
    }

    await upload({
      title: textFields.title,
      description: textFields.descriptionHasContent
        ? textFields.description
        : undefined,
      subjectId,
      professorId,
      examSession: sessionFields.session,
      examYear: sessionFields.year,
      additionalReading: readingLinks.toPayload(),
      files: files.validFiles.map((entry) => entry.file),
    })
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
    handleSubmit,
    reset: resetForm,
  }
}

export type UseCreateScriptFormReturn = ReturnType<typeof useCreateScriptForm>
