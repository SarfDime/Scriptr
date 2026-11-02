import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { ReactNode } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import {
  ADMIN_SECTIONS,
  AdminNavigation,
  type AdminSection,
} from './AdminNavigation'

/** Shared frame of the admin pages: the page header and section navigation.
 * The root layout already provides `<main>`. */
export const AdminPageLayout = ({
  section,
  children,
}: {
  section: AdminSection
  children: ReactNode
}) => (
  <PageLayout
    header={{
      greeting: ADMIN_STRINGS.title,
      title: ADMIN_SECTIONS[section].label,
    }}
  >
    <AdminNavigation current={section} />
    {children}
  </PageLayout>
)
