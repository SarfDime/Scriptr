import { localizedPath } from '@shared/utils/localized-path'
import { redirect } from 'next/navigation'
import type { LocalePageProps } from '@/types/localization.types'

/** Anonymous validation hits the gate's 404, so this page has no instant UI to assert. */
export const instant = false

export default async function AdminPage({ params }: LocalePageProps) {
  const { locale } = await params
  redirect(localizedPath('/admin/flags', locale))
}
