'use client'

import { useEffect } from 'react'
import { useLoading } from '@/providers/loading/LoadingProvider'
import { useUIStrings } from '@/providers/locale/use-strings'

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
  const ui = useUIStrings()
  const { statuses, progress } = ui.scripts.uploadModal

  useEffect(() => {
    if (stage === null) return undefined
    startTask(taskKey, {
      message: statuses[stage],
      hint: `${progress.qualityWarning} ${progress.qualityAdvice}`,
    })
    return () => finishTask(taskKey)
  }, [stage, taskKey, startTask, finishTask, statuses, progress])
}
