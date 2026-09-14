'use client'

import { apiRoutes } from '@shared/config/api-routes'
import { useState } from 'react'
import { apiFetch } from '@/lib/next-api'
import type { ScriptFileInput } from '../../shared/types/api.types'
import type { PortableTextValue } from '../../shared/types/portable-text.types'

export type ScriptUploadInput = {
  title: PortableTextValue
  description?: PortableTextValue
  subjectId: string
  professorId: string
  examSession?: string | null
  additionalReading?: Array<string>
  files: Array<File>
}

export type ScriptUploadState =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'creating' }
  | { status: 'success'; scriptId: string }
  | { status: 'error'; message: string }

type UploadResponse = { success: true; files: Array<ScriptFileInput> }
type CreateScriptResponse = { success: true; script: { id: string } }

export function useScriptUpload() {
  const [state, setState] = useState<ScriptUploadState>({ status: 'idle' })

  const upload = async (input: ScriptUploadInput) => {
    if (input.files.length === 0) {
      setState({ status: 'error', message: 'At least one file is required' })
      return
    }

    try {
      setState({ status: 'uploading' })

      const formData = new FormData()
      formData.append('subjectId', input.subjectId)
      for (const file of input.files) {
        formData.append('files', file)
      }

      const { files } = await apiFetch<UploadResponse>(
        apiRoutes.fileOps.upload,
        { method: 'POST', body: formData }
      )

      setState({ status: 'creating' })

      const { script } = await apiFetch<CreateScriptResponse>(
        apiRoutes.scripts.index,
        {
          method: 'POST',
          body: {
            title: input.title,
            description: input.description ?? null,
            subjectId: input.subjectId,
            professorId: input.professorId,
            examSession: input.examSession ?? null,
            additionalReading: input.additionalReading ?? [],
            files,
          },
        }
      )

      setState({ status: 'success', scriptId: script.id })
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
      })
    }
  }

  const reset = () => setState({ status: 'idle' })

  return { state, upload, reset }
}
