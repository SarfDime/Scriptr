import { Box } from '@/components/common/Box'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'
import { SkeletonText } from '@/components/ui/skeleton/SkeletonText'

export default function Loading() {
  return (
    <Box as='main' className='ui-container ui-section ui-stack gap-6'>
      <Box className='ui-stack gap-2'>
        <SkeletonText noOfLines={1} className='w-1/3' />
        <SkeletonText noOfLines={1} className='w-2/3' />
      </Box>
      <Skeleton loading className='h-10 w-full' />
      <Box className='ui-stack gap-3'>
        <Skeleton loading className='h-24 w-full' />
        <Skeleton loading className='h-24 w-full' />
        <Skeleton loading className='h-24 w-full' />
      </Box>
    </Box>
  )
}
