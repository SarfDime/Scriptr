'use client'

import type { PortableTextBlock } from '@portabletext/editor'
import { PORTABLE_TEXT_LIMITS } from '@shared/config/portable-text-limits'
import {
  ALLOWED_EXTENSIONS,
  SUBJECT_EXAM_SESSIONS,
} from '@shared/config/shared-constants'
import type { SubjectExamSession } from '@shared/types/academic.types'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import {
  isScriptDescriptionPortableTextValue,
  isScriptTitlePortableTextValue,
  portableTextJsonByteLength,
} from '@shared/utils/portable-text.utils'
import { type SubmitEvent, useEffect, useEffectEvent, useState } from 'react'
import { useScriptUpload } from '@/hooks/useScriptsUpload'
import { getExtension } from '@/lib/file-preview'
import type { MinimalSubject } from '@/types/academics/subject.types'
import type { SelectOptionType } from '@/types/components/Select.types'

const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024 // ~1MB

export type FileWithError = { file: File; error: string | null }

function hasText(blocks: Array<PortableTextBlock>) {
  return blocks.some((block) => {
    if (!Array.isArray(block.children)) return false

    return block.children.some(
      (child) =>
        typeof child === 'object' &&
        child !== null &&
        '_type' in child &&
        child._type === 'span' &&
        'text' in child &&
        typeof child.text === 'string' &&
        child.text.trim().length > 0
    )
  })
}

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
  const notifyCreated = useEffectEvent((scriptId: string) => {
    onCreated?.(scriptId)
  })

  const subjectId = subject.dbId ?? ''

  const [title, setTitle] = useState<PortableTextValue>([])
  const [description, setDescription] = useState<PortableTextValue>([])
  const [professorId, setProfessorId] = useState(
    () => subject.professors[0]?.dbId ?? ''
  )
  const [examSession, setExamSession] = useState<SubjectExamSession>(
    SUBJECT_EXAM_SESSIONS[0] ?? 'january'
  )
  const [readingLinks, setReadingLinks] = useState<Array<string>>([])
  const [files, setFiles] = useState<Array<FileWithError>>([])

  const isBusy = state.status === 'uploading' || state.status === 'creating'
  const validFiles = files.filter((entry) => entry.error === null)
  const titleTooLong =
    portableTextJsonByteLength(title) > PORTABLE_TEXT_LIMITS.scriptTitleBytes
  const descriptionTooLong =
    portableTextJsonByteLength(description) >
    PORTABLE_TEXT_LIMITS.scriptDescriptionBytes
  const canSubmit =
    !isBusy &&
    isScriptTitlePortableTextValue(title) &&
    isScriptDescriptionPortableTextValue(description) &&
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
    setTitle([])
    setDescription([])
    setProfessorId(subject.professors[0]?.dbId ?? '')
    setExamSession(SUBJECT_EXAM_SESSIONS[0] ?? 'january')
    setReadingLinks([])
    setFiles([])
    reset()
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    await upload({
      title,
      description: hasText(description) ? description : undefined,
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

  useEffect(() => {
    if (state.status === 'success') {
      notifyCreated(state.scriptId)
    }
  }, [state])

  return {
    // Field state + setters
    title,
    setTitle,
    description,
    setDescription,
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
    titleTooLong,
    descriptionTooLong,
    professors,
    examSessions,

    // Upload state + actions
    uploadState: state,
    handleSubmit,
    resetForm,
  }
}

export type UseCreateScriptFormReturn = ReturnType<typeof useCreateScriptForm>
