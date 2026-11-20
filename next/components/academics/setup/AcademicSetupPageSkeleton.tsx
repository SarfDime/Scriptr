import { Box } from '@/components/common/Box'
import { PageLayout } from '@/components/layout/PageLayout'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'
import { SkeletonText } from '@/components/ui/skeleton/SkeletonText'

/** The setup page before the reader's own profile for the study is known: the
 * heading and the boxes, in the page's own column. */
export const AcademicSetupPageSkeleton = () => (
  <PageLayout
    header={<SkeletonText noOfLines={2} className='w-1/3' />}
    aria-busy='true'
  >
    <Box className='ui-stack gap-3'>
      <Skeleton loading className='h-10 w-full' />
      <Skeleton loading className='h-32 w-full' />
      <Skeleton loading className='h-10 w-40' />
    </Box>
  </PageLayout>
)
