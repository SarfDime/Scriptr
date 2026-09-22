'use client'

import { useState } from 'react'
import { createScript, uploadFiles } from '@/lib/api/scripts-api'
import type {
  ScriptUploadInput,
  ScriptUploadState,
} from '@/types/components/Scripts.types'

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

      const files = await uploadFiles(formData)

      setState({ status: 'creating' })

      const script = await createScript(input, files)

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
