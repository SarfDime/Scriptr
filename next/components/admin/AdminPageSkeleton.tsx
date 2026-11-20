import { Box } from '@/components/common/Box'
import { PageLayout } from '@/components/layout/PageLayout'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'
import { SkeletonText } from '@/components/ui/skeleton/SkeletonText'

/**
 * The admin surface before its data — and its own unlock check — resolve. Every
 * admin page reads the request, so this is what their static shell carries and
 * what the segment's `loading.tsx` shows on a navigation.
 */
export const AdminPageSkeleton = () => (
  <PageLayout
    header={<SkeletonText noOfLines={2} className='w-1/3' />}
    aria-busy='true'
  >
    <Skeleton loading className='h-9 w-80' />
    <Box className='ui-stack gap-3'>
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={`admin-loading-${index}`} loading className='h-28' />
      ))}
    </Box>
  </PageLayout>
)
