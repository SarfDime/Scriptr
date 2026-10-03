'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { useState } from 'react'
import { createScript, uploadFiles } from '@/lib/api/scripts-api'
import { useToast } from '@/providers/toaster/ToasterProvider'
import type {
  ScriptUploadInput,
  ScriptUploadState,
} from '@/types/components/Scripts.types'

export function useScriptUpload() {
  const [state, setState] = useState<ScriptUploadState>({ status: 'idle' })
  const { addToast } = useToast()

  const upload = async (input: ScriptUploadInput) => {
    if (input.files.length === 0) {
      setState({ status: 'error', message: 'At least one file is required' })
      addToast({
        type: 'error',
        title: UI_STRINGS.scripts.uploadModal.statuses.error,
        description: 'At least one file is required.',
      })
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
      addToast({
        type: 'success',
        title: UI_STRINGS.scripts.uploadModal.statuses.success,
        description: 'Your script is now available to the subject community.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed'
      setState({
        status: 'error',
        message,
      })
      addToast({
        type: 'error',
        title: UI_STRINGS.scripts.uploadModal.statuses.error,
        description: message,
      })
    }
  }

  const reset = () => setState({ status: 'idle' })

  return { state, upload, reset }
}
