import { Suspense } from 'react'
import { AuthCard } from '@/components/auth/AuthCard'
import { PageLayout } from '@/components/layout/PageLayout'
import { cn } from '@/lib/common-utils'

/**
 * A static shell: the card below is a client component and this page reads no
 * request-time API. Pinned so a later edit cannot quietly turn the route
 * dynamic — drop this line if it ever needs `cookies()`, `headers()` or search
 * params.
 */
export const ensureStatic = 'navigation'

export default function AuthPage() {
  return (
    <PageLayout
      className={cn(
        'flex items-center justify-center min-h-[60dvh]',
        // Mobile: the card fills the viewport below the 4rem sticky header and
        // above the footer.
        'max-md:min-h-[calc(100dvh-4rem-var(--footer-height))] max-md:items-stretch max-md:p-0'
      )}
    >
      <Suspense>
        <AuthCard />
      </Suspense>
    </PageLayout>
  )
}
