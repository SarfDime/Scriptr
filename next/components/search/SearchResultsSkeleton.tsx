import { Box } from '@/components/common/Box'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'

/** The search form and its results, before the query in the URL is known. */
export const SearchResultsSkeleton = () => (
  <Box className='ui-stack gap-6' aria-busy='true'>
    <Skeleton loading className='h-10 w-full' />
    <Box className='ui-stack gap-3'>
      <Skeleton loading className='h-24 w-full' />
      <Skeleton loading className='h-24 w-full' />
      <Skeleton loading className='h-24 w-full' />
    </Box>
  </Box>
)
