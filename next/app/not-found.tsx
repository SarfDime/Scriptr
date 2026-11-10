import { UI_STRINGS } from '@shared/config/strings'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/PageLayout'
import { ErrorState } from '@/components/ui/ErrorState'

/**
 * Root 404 for a URL no route matched. It renders outside the per-tree layouts,
 * so it brings the catalog chrome with it — the action that matters here is a
 * way back, and that needs the header and nav.
 */
export default function NotFound() {
  return (
    <MainLayout>
      <ErrorState
        title={UI_STRINGS.general.errors.notFoundTitle}
        description={UI_STRINGS.general.errors.notFoundDescription}
        action={
          <Link href='/' className='button solid'>
            {UI_STRINGS.general.errors.backHome}
          </Link>
        }
      />
    </MainLayout>
  )
}
