'use client'

import Download from '@sanity/icons/Download'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import { useUIStrings } from '@/providers/locale/use-strings'

/** Read-only download count for script cards, in the card's top-right corner. */
export const ScriptDownloadCount = ({
  downloads,
  className,
}: {
  downloads: number
  className?: string
}) => {
  const ui = useUIStrings()

  return (
    <Box className={cn('ui-caption flex items-center gap-1.5 p-2', className)}>
      <Download aria-hidden='true' />
      <Text aria-hidden='true'>{downloads}</Text>
      <Text className='sr-only'>
        {ui.scripts.actions.downloadCount(downloads)}
      </Text>
    </Box>
  )
}
