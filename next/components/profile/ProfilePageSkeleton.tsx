import { Box } from '@/components/common/Box'
import { PageLayout } from '@/components/layout/PageLayout'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'
import { SkeletonText } from '@/components/ui/skeleton/SkeletonText'

/**
 * The profile page before the profile is known: the heading, the card and the
 * two lists keep the page's own columns, so the real content replaces it
 * without moving anything.
 *
 * The pages that use it resolve the account inside a `<Suspense>` boundary —
 * their URL is not known at build time — so this is what their static shell
 * carries.
 */
export const ProfilePageSkeleton = () => (
  <PageLayout
    header={<SkeletonText noOfLines={2} className='w-1/3' />}
    aria-busy='true'
  >
    <Skeleton loading className='h-40 w-full' />
    <Box className='ui-stack gap-3'>
      <Skeleton loading className='h-24 w-full' />
      <Skeleton loading className='h-24 w-full' />
    </Box>
  </PageLayout>
)
