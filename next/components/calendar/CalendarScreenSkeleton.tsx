import { CALENDAR_STRINGS_PACK } from '@shared/strings/calendar-strings'
import { Box } from '@/components/common/Box'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'
import { SkeletonText } from '@/components/ui/skeleton/SkeletonText'
import { getServerStrings } from '@/lib/server-strings'

/**
 * The calendar before its period is resolved: the toolbar and the grid, in the
 * screen's own column. The page and this segment's `loading.tsx` share it.
 */
export const CalendarScreenSkeleton = async () => {
  const strings = await getServerStrings(CALENDAR_STRINGS_PACK)

  return (
    <Box className='ui-stack ui-section gap-6'>
      <Box role='status' className='sr-only'>
        {strings.loadingLabel}
      </Box>
      <Box className='ui-stack gap-2'>
        <SkeletonText noOfLines={1} className='w-1/3' />
        <SkeletonText noOfLines={1} className='w-2/3' />
      </Box>
      <Skeleton loading className='h-10 w-full' />
      <Box className='grid grid-cols-7 gap-1'>
        {Array.from({ length: 35 }, (_, index) => (
          <Skeleton
            key={`calendar-skeleton-${index}`}
            loading
            className='h-24 w-full'
          />
        ))}
      </Box>
    </Box>
  )
}
