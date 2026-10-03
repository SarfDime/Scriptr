'use client'

import type { ScriptFile } from '@shared/types/scripts.types'
import { useState } from 'react'
import { Box, type BoxProps } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { downloadScript } from '@/lib/api/scripts-api'
import { cn } from '@/lib/common-utils'

export type ScriptDownloadButtonProps = {
  scriptId: string
  file: ScriptFile
} & Omit<BoxProps, 'children'>

/** POST apiRoutes.scripts.downloadById records the attempt server-side
 * (service-role client, dedup'd account → IP → device per ARCHITECTURE.md
 * §5) before the file itself opens. Not restriction-checked — guests can
 * download — so no useProtectedAction wrapper.
 */
export function ScriptDownloadButton({
  scriptId,
  file,
  className,
  ...props
}: ScriptDownloadButtonProps) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'error'>('idle')

  const handleDownload = async () => {
    setStatus('pending')
    try {
      const url = await downloadScript(scriptId, file)
      window.open(url, '_blank', 'noopener,noreferrer')
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <Box className={cn('ui-stack gap-1', className)} {...props}>
      <Button
        onClick={handleDownload}
        disabled={status === 'pending'}
        className='button outline'
      >
        {status === 'pending' ? 'Preparing…' : `Download (${file.file_type})`}
      </Button>
      {status === 'error' && (
        <Text className='ui-caption text-danger-600'>
          Download failed — try again.
        </Text>
      )}
    </Box>
  )
}
