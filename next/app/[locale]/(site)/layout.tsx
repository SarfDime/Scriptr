import type { ReactNode } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'

/**
 * The catalog's chrome: the same header, main column and footer every page had,
 * without a calendar alert — a calendar belongs to a study, and only the study
 * tree knows which one.
 *
 * `admin`, `auth` and the study tree are siblings of this group, so each has
 * exactly one chrome. The root layout owns only what is truly global: the
 * providers, the background, the navigation drawer and the notification tray.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return <MainLayout>{children}</MainLayout>
}
