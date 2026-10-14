'use client'

import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import { useEffect, useRef } from 'react'
import { useToast } from '@/providers/toaster/ToasterProvider'

/** Shows a single error toast when the viewer's vote/save/session lookups
 * failed on the server. Renders nothing. */
export function ViewerDataNotice() {
  const { addToast } = useToast()
  const shownRef = useRef(false)

  useEffect(() => {
    if (shownRef.current) return
    shownRef.current = true
    addToast({
      type: 'error',
      title: SCRIPT_STRINGS.viewerDataFailed.title,
      description: SCRIPT_STRINGS.viewerDataFailed.description,
    })
  }, [addToast])

  return null
}
