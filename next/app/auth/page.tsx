import { Suspense } from 'react'
import { AuthCard } from '@/components/auth/AuthCard'
import { PageLayout } from '@/components/layout/PageLayout'

export default function AuthPage() {
  return (
    <PageLayout
      className={[
        'flex items-center justify-center min-h-[60vh]',
        // Mobile: the card fills the viewport below the 4rem sticky header.
        'max-md:min-h-[calc(100dvh-4rem)] max-md:items-stretch max-md:p-0',
      ].join(' ')}
    >
      <Suspense>
        <AuthCard />
      </Suspense>
    </PageLayout>
  )
}
