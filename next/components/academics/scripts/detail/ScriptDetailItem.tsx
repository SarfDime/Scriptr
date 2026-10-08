import type { ReactNode } from 'react'
import { Box } from '@/components/common/Box'

/** One labelled `dt`/`dd` pair. Render inside a `dl`. */
export function ScriptDetailItem({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <Box className='ui-stack gap-0.5'>
      <dt className='ui-caption'>{label}</dt>
      <dd className='ui-label'>{children}</dd>
    </Box>
  )
}
