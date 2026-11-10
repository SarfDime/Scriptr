import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import { cookies } from 'next/headers'
import type { ReactNode } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { ADMIN_STUDY_COOKIE } from '@/lib/admin-study'
import { getAdminStudies } from '@/lib/api/admin-studies-api'
import {
  ADMIN_SECTIONS,
  AdminNavigation,
  type AdminSection,
} from './AdminNavigation'
import { AdminStudySwitcher } from './AdminStudySwitcher'

/** Shared frame of the admin pages: the page header, the section navigation and
 * the study switcher every section acts on. The root layout already provides
 * `<main>`. */
export const AdminPageLayout = async ({
  section,
  children,
}: {
  section: AdminSection
  children: ReactNode
}) => {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  const [studies, selected] = await Promise.all([
    getAdminStudies(cookieHeader),
    Promise.resolve(cookieStore.get(ADMIN_STUDY_COOKIE)?.value ?? null),
  ])
  const isOwner = studies.some((study) => study.role === 'owner')
  const viewer = {
    isOwner,
    canReviewDownloads:
      isOwner || studies.some((study) => study.role === 'admin'),
  }

  return (
    <PageLayout
      header={{
        greeting: ADMIN_STRINGS.title,
        title: ADMIN_SECTIONS[section].label,
      }}
    >
      <AdminNavigation current={section} viewer={viewer} />
      {studies.length > 0 && (
        <AdminStudySwitcher studies={studies} selected={selected} />
      )}
      {children}
    </PageLayout>
  )
}
