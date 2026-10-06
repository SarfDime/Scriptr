'use client'

import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import type { ScriptFile } from '@shared/types/scripts.types'
import { type ReactNode, useState } from 'react'
import { Box, type BoxProps } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { downloadScript } from '@/lib/api/scripts-api'
import { cn } from '@/lib/common-utils'
import { useToast } from '@/providers/toaster/ToasterProvider'

export type ScriptDownloadButtonProps = {
  scriptId: string
  file: ScriptFile
  /** Overrides the button's classes (default `button outline`). */
  buttonClassName?: string
  /** Shown before the label, including while the download is being prepared. */
  icon?: ReactNode
} & BoxProps

/** POST apiRoutes.scripts.downloadById records the attempt server-side
 * (service-role client, dedup'd account → IP → device per ARCHITECTURE.md
 * §5) before the file itself opens. Not restriction-checked — guests can
 * download — so no useProtectedAction wrapper. Failures surface as a toast,
 * like the other script actions.
 */
export function ScriptDownloadButton({
  scriptId,
  file,
  children,
  icon,
  buttonClassName = 'button outline',
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
    <Box className={cn(className)} {...props}>
      <Button
        onClick={handleDownload}
        disabled={isPending}
        className={buttonClassName}
      >
        {icon}
        {isPending
          ? SCRIPT_STRINGS.download.preparing
          : (children ?? SCRIPT_STRINGS.download.defaultLabel(file.file_type))}
      </Button>
    </Box>
  )
}
