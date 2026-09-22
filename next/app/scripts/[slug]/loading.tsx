import { Box } from '@/components/common/Box'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'
import { SkeletonCircle } from '@/components/ui/skeleton/SkeletonCircle'
import { SkeletonText } from '@/components/ui/skeleton/SkeletonText'

export default function Loading() {
  return (
    <Box as='main' className='ui-container ui-section ui-stack gap-6'>
      <Box className='ui-stack gap-2'>
        <SkeletonText noOfLines={1} className='w-2/3' />
        <SkeletonText noOfLines={3} />
      </Box>

      <div className='ui-cluster gap-3 items-center'>
        <Skeleton loading className='h-9 w-24' />
        <SkeletonCircle size='36' />
        <Skeleton loading className='h-9 w-28' />
        <Skeleton loading className='h-9 w-9 rounded-full' />
      </div>

      <Box className='ui-stack gap-3'>
        <Skeleton loading className='h-16 w-full' />
        <Skeleton loading className='h-16 w-full' />
      </Box>

      <Box className='ui-stack gap-3'>
        <SkeletonText noOfLines={1} className='w-1/4' />
        <Skeleton loading className='h-24 w-full' />
        <Skeleton loading className='h-24 w-full' />
      </Box>
    </Box>
  )
}
