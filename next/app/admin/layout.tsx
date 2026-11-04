import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { AdminAccessGate } from '@/components/admin/AdminAccessGate'
import { isAdminUnlocked } from '@/lib/api/admin-access-api'
import { getSessionRequired } from '@/lib/api/auth-api'

/**
 * Two gates: an admin session, then the ten-minute TOTP unlock the admin API
 * also requires. The unlock is checked server-side on every render, so an
 * expired cookie shows the code form instead of a page of rejected requests.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const cookieHeader = (await cookies()).toString()
  const session = await getSessionRequired(cookieHeader)
  if (session.user?.role !== 'admin') notFound()

  if (!(await isAdminUnlocked(cookieHeader))) return <AdminAccessGate />

  return children
}
