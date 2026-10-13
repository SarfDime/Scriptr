import { Suspense } from 'react'
import { AuthCard } from '@/components/auth/AuthCard'
import { PageLayout } from '@/components/layout/PageLayout'
import { cn } from '@/lib/common-utils'

export default function AuthPage() {
  return (
    <PageLayout
      className={cn(
        'flex items-center justify-center min-h-[60dvh]',
        // Mobile: the card fills the viewport below the 4rem sticky header.
        'max-md:min-h-[calc(100dvh-4rem)] max-md:items-stretch max-md:p-0'
      )}
    >
      <Suspense>
        <AuthCard />
      </Suspense>
    </PageLayout>
  )
}
