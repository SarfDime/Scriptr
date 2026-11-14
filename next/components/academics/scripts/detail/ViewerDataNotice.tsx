'use client'

import { SCRIPT_STRINGS_PACK } from '@shared/strings/scripts-strings'
import { useEffect, useRef } from 'react'
import { useStrings } from '@/providers/locale/use-strings'
import { useToast } from '@/providers/toaster/ToasterProvider'

/** Shows a single error toast when the viewer's vote/save/session lookups
 * failed on the server. Renders nothing. */
export function ViewerDataNotice() {
  const { addToast } = useToast()
  const strings = useStrings(SCRIPT_STRINGS_PACK)
  const shownRef = useRef(false)

  useEffect(() => {
    if (shownRef.current) return
    shownRef.current = true
    addToast({
      type: 'error',
      title: strings.viewerDataFailed.title,
      description: strings.viewerDataFailed.description,
    })
  }, [addToast, strings])

  return null
}
