import { Box } from '@/components/common/Box'
import { PageLayout } from '@/components/layout/PageLayout'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'
import { SkeletonText } from '@/components/ui/skeleton/SkeletonText'

/** The list itself, in the column the feed renders it in. */
export const ScriptsListSkeleton = () => (
  <Box className='ui-stack gap-3' aria-busy='true'>
    <SkeletonText noOfLines={1} className='w-1/3' />
    <Skeleton loading className='h-24 w-full' />
    <Skeleton loading className='h-24 w-full' />
    <Skeleton loading className='h-24 w-full' />
  </Box>
)

/** The feed page before its study is known: the heading and the list, in the
 * page's own layout. */
export const ScriptsPageSkeleton = () => (
  <PageLayout
    header={<SkeletonText noOfLines={2} className='w-1/3' />}
    aria-busy='true'
  >
    <ScriptsListSkeleton />
  </PageLayout>
)
