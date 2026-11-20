'use client'

import { useState } from 'react'
import { useProtectedAction } from '@/hooks/useProtectedAction'
import { createScript, uploadScriptFiles } from '@/lib/api/scripts-api'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useUIStrings } from '@/providers/locale/use-strings'
import { useToast } from '@/providers/toaster/ToasterProvider'
import type {
  ScriptUploadInput,
  ScriptUploadState,
} from '@/types/components/Scripts.types'

export function useScriptUpload() {
  const { locale } = useLocale()
  const ui = useUIStrings()
  const { statuses } = ui.scripts.uploadModal
  const [state, setState] = useState<ScriptUploadState>({ status: 'idle' })
  const { addToast } = useToast()
  const { run: runProtected } = useProtectedAction(
    async (input: ScriptUploadInput) => {
      setState({ status: 'uploading' })

      const files =
        input.files.length > 0
          ? await uploadScriptFiles(
              input.subjectId,
              input.files,
              locale,
              (stage) => setState({ status: stage })
            )
          : []

      setState({ status: 'creating' })
      const script = await createScript(input, files)
      setState({ status: 'success', scriptId: script.id })
      addToast({
        type: 'success',
        title: statuses.success,
        description: statuses.successDescription,
      })
      return script.id
    },
    { errorTitle: statuses.error }
  )

  /** Resolves with the created script's id, so the caller can react to success
   * where the upload was started; `null` when it failed or was rejected. */
  const upload = async (input: ScriptUploadInput) => {
    const result = await runProtected(input)
    if (!result.ok) {
      setState({ status: 'idle' })
      return null
    }
    return result.data
  }

  const reset = () => setState({ status: 'idle' })

  return { state, upload, reset }
}
