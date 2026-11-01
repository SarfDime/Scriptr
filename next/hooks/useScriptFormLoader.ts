'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { useEffect } from 'react'
import { useLoading } from '@/providers/loading/LoadingProvider'

/** The stages a script form can spend real time in. */
export type ScriptFormStage = 'uploading' | 'optimizing' | 'creating'

/**
 * Shows the global loader while a script form uploads, optimizes or saves.
 * Nothing on the page is reachable behind the loader, so the dialog behind it
 * needs no spinner of its own. `taskKey` names the task the dialog owns, so it
 * is released again on unmount.
 */
export function useScriptFormLoader(
  taskKey: string,
  stage: ScriptFormStage | null
) {
  const { startTask, finishTask } = useLoading()

  useEffect(() => {
    if (stage === null) return undefined
    startTask(taskKey, {
      message: UI_STRINGS.scripts.uploadModal.statuses[stage],
      hint: `${UI_STRINGS.scripts.uploadModal.progress.qualityWarning} ${UI_STRINGS.scripts.uploadModal.progress.qualityAdvice}`,
    })
    return () => finishTask(taskKey)
  }, [stage, taskKey, startTask, finishTask])
}
