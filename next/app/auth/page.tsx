import { Suspense } from 'react'
import { AuthCard } from '@/components/auth/AuthCard'
import { PageLayout } from '@/components/layout/PageLayout'

export default function AuthPage() {
  return (
    <PageLayout className='flex items-center justify-center min-h-[60vh]'>
      <Suspense>
        <AuthCard />
      </Suspense>
    </PageLayout>
  )
}
