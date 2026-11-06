import { CALENDAR_STRINGS } from '@shared/strings/calendar-strings'
import { Box } from '@/components/common/Box'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'
import { SkeletonText } from '@/components/ui/skeleton/SkeletonText'

export default function Loading() {
  return (
    <Box className='ui-stack ui-section gap-6'>
      <Box role='status' className='sr-only'>
        {CALENDAR_STRINGS.loadingLabel}
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
