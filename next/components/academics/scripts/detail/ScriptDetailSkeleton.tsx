import { Box } from '@/components/common/Box'
import { PageLayout } from '@/components/layout/PageLayout'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'
import { SkeletonCircle } from '@/components/ui/skeleton/SkeletonCircle'
import { SkeletonText } from '@/components/ui/skeleton/SkeletonText'

/** Placeholder for everything under the script title while the detail body
 * loads. */
export function ScriptDetailSkeleton() {
  return (
    <Box className='ui-stack gap-6'>
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

/** The whole script page before its slug resolves: the page's heading plus the
 * detail body's own placeholder, in the layout the real page uses. */
export function ScriptDetailPageSkeleton() {
  return (
    <PageLayout aria-busy='true'>
      <SkeletonText noOfLines={1} className='w-2/5' />
      <ScriptDetailSkeleton />
    </PageLayout>
  )
}
