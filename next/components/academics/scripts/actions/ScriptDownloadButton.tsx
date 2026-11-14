'use client'

import Download from '@sanity/icons/Download'
import { SCRIPT_STRINGS_PACK } from '@shared/strings/scripts-strings'
import type { ScriptFile } from '@shared/types/scripts.types'
import { useState } from 'react'
import { Button, type ButtonProps } from '@/components/common/Button'
import { downloadScript } from '@/lib/api/scripts-api'
import { cn } from '@/lib/common-utils'
import { useStrings } from '@/providers/locale/use-strings'
import { useToast } from '@/providers/toaster/ToasterProvider'
import type { SanityIconProps } from '@/types/component.types'

export type ScriptDownloadButtonProps = {
  scriptId: string
  file: ScriptFile
  iconProps?: SanityIconProps
} & ButtonProps

/** POST apiRoutes.scripts.downloadById records the attempt server-side
 * (service-role client, deduped account → IP → device per
 * docs/ARCHITECTURE-MODERATION.md) before the file is saved to disk. Not
 * restriction-checked — guests can download — so no useProtectedAction
 * wrapper. Failures surface as a toast, like the other script actions.
 */
export function ScriptDownloadButton({
  scriptId,
  file,
  children,
  iconProps,
  className,
  ...props
}: ScriptDownloadButtonProps) {
  const [isPending, setIsPending] = useState(false)
  const { addToast } = useToast()
  const strings = useStrings(SCRIPT_STRINGS_PACK)

  const handleDownload = async () => {
    setIsPending(true)
    try {
      const url = await downloadScript(scriptId, file)
      // The URL answers with `Content-Disposition: attachment`, so this saves
      // the file and leaves the page where it is.
      window.location.assign(url)
    } catch {
      addToast({
        type: 'error',
        title: strings.download.failedTitle,
        description: strings.download.failedDescription,
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button
      {...props}
      onClick={handleDownload}
      disabled={isPending}
      className={className ? cn('button', className) : 'button ghost button-sm'}
    >
      <Download
        {...iconProps}
        className={cn('overwrite size-5 shrink-0', iconProps?.className)}
      />
      {isPending
        ? strings.download.preparing
        : (children ?? strings.download.defaultLabel(file.file_type))}
    </Button>
  )
}
