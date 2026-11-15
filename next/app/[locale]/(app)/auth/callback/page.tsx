import { AuthCallbackCard } from '@/components/auth/AuthCallbackCard'
import { PageLayout } from '@/components/layout/PageLayout'

/** The OAuth return address. The card is the Client Component — it reads the
 * token fragment from `window.location`, which never reaches the server — so the
 * page and its layout render on the server like any other. */
export default function AuthCallbackPage() {
  return (
    <PageLayout className='flex items-center justify-center min-h-[60vh]'>
      <AuthCallbackCard />
    </PageLayout>
  )
}
