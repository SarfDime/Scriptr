import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { AdminAccessGate } from '@/components/admin/AdminAccessGate'
import { isAdminUnlocked } from '@/lib/api/admin-access-api'
import { getSessionRequired } from '@/lib/api/auth-api'

/**
 * Two gates: an admin session, then the twenty-minute TOTP unlock the admin API
 * also requires. An expired cookie shows the code form instead of a page of
 * rejected requests.
 *
 * The unlock check here only covers a full load: a layout is not re-rendered
 * when the browser moves between admin pages, so each page also calls
 * `requireAdminUnlock` (`next/lib/admin-page-guard.ts`) before its loader.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const cookieHeader = (await cookies()).toString()
  const session = await getSessionRequired(cookieHeader)
  const user = session.user
  // An owner sees every study; a study admin or moderator sees the admin
  // surface restricted to their studies.
  const canEnter = user?.role === 'owner' || (user?.study_roles.length ?? 0) > 0
  if (!canEnter) notFound()

  if (!(await isAdminUnlocked(cookieHeader))) return <AdminAccessGate />

  return children
}
