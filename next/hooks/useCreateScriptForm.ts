'use client'

import {
  ALLOWED_EXTENSIONS,
  SUBJECT_EXAM_SESSIONS,
} from '@shared/config/shared-constants'
import type { SubjectExamSession } from '@shared/types/academic.types'
import { useEffect, useState } from 'react'
import { useScriptUpload } from '@/hooks/useScriptsUpload'
import { getExtension } from '@/lib/file-preview'
import { plainTextToPortableText } from '@/lib/portable-text'
import type { MinimalSubject } from '@/types/academics/subject.types'
import type { SelectOptionType } from '@/types/components/Select.types'

const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024 // ~1MB

export type FileWithError = { file: File; error: string | null }

function validateFile(file: File): string | null {
  const extension = getExtension(file.name)
  if (
    !ALLOWED_EXTENSIONS.includes(
      extension as (typeof ALLOWED_EXTENSIONS)[number]
    )
  ) {
    return `Unsupported file type (.${extension})`
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File exceeds ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`
  }
  return null
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export type UseCreateScriptFormArgs = {
  subject: MinimalSubject
  onCreated?: (scriptId: string) => void
}

/**
 * Owns all create-script form state and file validation. The actual
 * two-step upload (files → R2, then the script record) stays delegated to
 * `useScriptUpload`; this hook never talks to the API directly — it just
 * shapes the form's state into that hook's input.
 *
 * BUGFIX: `subjectId` used to be independent `useState('')` with no setter
 * ever wired to anything — the modal is scoped to a single fixed `subject`
 * prop (not a picker), so it's derived here instead. Previously this meant
 * `canSubmit` was always `false` in practice.
 */
export function useCreateScriptForm({
  subject,
  onCreated,
}: UseCreateScriptFormArgs) {
  const { state, upload, reset } = useScriptUpload()

  const subjectId = subject.dbId ?? ''

  const [titleText, setTitleText] = useState('')
  const [descriptionText, setDescriptionText] = useState('')
  const [professorId, setProfessorId] = useState('')
  const [examSession, setExamSession] = useState<SubjectExamSession>(
    SUBJECT_EXAM_SESSIONS[0] ?? 'january'
  )
  const [readingLinks, setReadingLinks] = useState<Array<string>>([])
  const [files, setFiles] = useState<Array<FileWithError>>([])

  const isBusy = state.status === 'uploading' || state.status === 'creating'
  const validFiles = files.filter((entry) => entry.error === null)
  const canSubmit =
    !isBusy &&
    titleText.trim().length > 0 &&
    subjectId.length > 0 &&
    professorId.length > 0 &&
    validFiles.length > 0

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const next = Array.from(incoming).map((file) => ({
      file,
      error: validateFile(file),
    }))
    setFiles((prev) => [...prev, ...next])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const clearFiles = () => setFiles([])

  const addReadingLink = () => setReadingLinks((prev) => [...prev, ''])
  const updateReadingLink = (index: number, value: string) =>
    setReadingLinks((prev) =>
      prev.map((link, i) => (i === index ? value : link))
    )
  const removeReadingLink = (index: number) =>
    setReadingLinks((prev) => prev.filter((_, i) => i !== index))

  const resetForm = () => {
    setTitleText('')
    setDescriptionText('')
    setProfessorId('')
    setExamSession(SUBJECT_EXAM_SESSIONS[0] ?? 'january')
    setReadingLinks([])
    setFiles([])
    reset()
  }

  const handleSubmit = async () => {
    if (!canSubmit) return

    await upload({
      title: plainTextToPortableText(titleText.trim()),
      description: descriptionText.trim()
        ? plainTextToPortableText(descriptionText.trim())
        : undefined,
      subjectId,
      professorId,
      examSession: examSession.trim() || undefined,
      additionalReading: readingLinks
        .map((link) => link.trim())
        .filter(Boolean),
      files: validFiles.map((entry) => entry.file),
    })
  }

  const professors: Array<SelectOptionType> = subject.professors.map(
    (professor) => ({
      id: String(professor._id),
      value: String(professor.dbId),
      label: professor.name,
    })
  )

  const examSessions = SUBJECT_EXAM_SESSIONS.map((session) => ({
    id: session,
    value: session,
    label: session.charAt(0).toUpperCase() + session.slice(1),
  }))

  // Side effect (notifying the parent) belongs in an effect, not render body.
  useEffect(() => {
    if (state.status === 'success') {
      onCreated?.(state.scriptId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, onCreated])

  return {
    // Field state + setters
    titleText,
    setTitleText,
    descriptionText,
    setDescriptionText,
    professorId,
    setProfessorId,
    examSession,
    setExamSession,
    readingLinks,
    addReadingLink,
    updateReadingLink,
    removeReadingLink,
    files,
    addFiles,
    removeFile,
    clearFiles,

    // Derived
    isBusy,
    canSubmit,
    professors,
    examSessions,

    // Upload state + actions
    uploadState: state,
    handleSubmit,
    resetForm,
  }
}

export type UseCreateScriptFormReturn = ReturnType<typeof useCreateScriptForm>
