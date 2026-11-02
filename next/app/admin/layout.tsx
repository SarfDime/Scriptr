import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { getSessionRequired } from '@/lib/api/auth-api'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const cookieHeader = (await cookies()).toString()
  const session = await getSessionRequired(cookieHeader)
  if (session.user?.role !== 'admin') notFound()
  return children
}
