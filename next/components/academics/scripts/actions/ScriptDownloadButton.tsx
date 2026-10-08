'use client'

import Download from '@sanity/icons/Download'
import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import type { ScriptFile } from '@shared/types/scripts.types'
import { useState } from 'react'
import { Button, type ButtonProps } from '@/components/common/Button'
import { downloadScript } from '@/lib/api/scripts-api'
import { cn } from '@/lib/common-utils'
import { useToast } from '@/providers/toaster/ToasterProvider'
import type { SanityIconProps } from '@/types/component.types'

export type ScriptDownloadButtonProps = {
  scriptId: string
  file: ScriptFile
  iconProps?: SanityIconProps
} & ButtonProps

/** POST apiRoutes.scripts.downloadById records the attempt server-side
 * (service-role client, deduped account → IP → device per ARCHITECTURE.md
 * §5) before the file itself opens. Not restriction-checked — guests can
 * download — so no useProtectedAction wrapper. Failures surface as a toast,
 * like the other script actions.
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

  const handleDownload = async () => {
    setIsPending(true)
    try {
      const url = await downloadScript(scriptId, file)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      addToast({
        type: 'error',
        title: SCRIPT_STRINGS.download.failedTitle,
        description: SCRIPT_STRINGS.download.failedDescription,
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
        ? SCRIPT_STRINGS.download.preparing
        : (children ?? SCRIPT_STRINGS.download.defaultLabel(file.file_type))}
    </Button>
  )
}
