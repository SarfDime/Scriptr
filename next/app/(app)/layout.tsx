import type { ReactNode } from 'react'
import { MainLayout } from '@/components/layout/PageLayout'

/** The account and admin surfaces keep the catalog's chrome: they have no study
 * of their own, so no calendar alert. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <MainLayout>{children}</MainLayout>
}
