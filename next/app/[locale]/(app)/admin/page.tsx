import { localizedPath } from '@shared/utils/localized-path'
import { redirect } from 'next/navigation'
import type { LocalePageProps } from '@/types/localization.types'

export default async function AdminPage({ params }: LocalePageProps) {
  const { locale } = await params
  redirect(localizedPath('/admin/flags', locale))
}
