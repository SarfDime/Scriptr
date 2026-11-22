import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { type ReactNode, Suspense } from 'react'
import { AdminAccessGate } from '@/components/admin/AdminAccessGate'
import { AdminPageSkeleton } from '@/components/admin/AdminPageSkeleton'
import { isAdminUnlocked } from '@/lib/api/admin-access-api'
import { getSessionRequired } from '@/lib/api/auth-api'

/** A private surface: nothing here should be indexed, and the links only lead
 * deeper into admin. `next.config.ts` repeats this as `X-Robots-Tag`. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/** Validation renders anonymously and the gate answers 404, so there is no
 * instant admin UI to assert. */
export const instant = false

/**
 * Two gates: an admin session, then the twenty-minute TOTP unlock the admin API
 * also requires. An expired cookie shows the code form instead of a page of
 * rejected requests.
 *
 * Both read the request, so the gate is a leaf inside a boundary and the admin
 * shell around it is prerendered. The unlock check here only covers a full load:
 * a layout is not re-rendered when the browser moves between admin pages, so
 * each page also calls `requireAdminUnlock` (`next/lib/admin-page-guard.ts`)
 * before its loader.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  )
}

async function AdminGate({ children }: { children: ReactNode }) {
  await connection()

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
