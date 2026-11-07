import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import { PageLayout } from '@/components/layout/PageLayout'
import { AdminAccessForm } from './AdminAccessForm'

/**
 * What `/admin/*` renders while the twenty-minute unlock is missing or spent. It
 * replaces the page rather than sitting above it: while locked, every admin
 * request would be rejected, so there is nothing useful to show behind it.
 */
export const AdminAccessGate = () => (
  <PageLayout
    header={{ greeting: ADMIN_STRINGS.title, title: ADMIN_STRINGS.accessTitle }}
  >
    <AdminAccessForm />
  </PageLayout>
)
