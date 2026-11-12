'use client'

import DashboardIcon from '@sanity/icons/Dashboard'
import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import { NextLink } from '@/components/common/NextLink'
import { catalogUrl } from '@/lib/study-origin'
import { useSession } from '@/providers/SessionProvider'

export const AdminNavLink = () => {
  const { session } = useSession()
  if (session.status !== 'authenticated') return null

  const canEnter =
    session.user.role === 'owner' || session.user.study_roles.length > 0
  if (!canEnter) return null
  return (
    <NextLink
      href={catalogUrl('/admin')}
      className='button subtle shrink-0 gap-1.5 rounded-lg px-3 py-2 text-sm'
    >
      <DashboardIcon />
      {ADMIN_STRINGS.nav}
    </NextLink>
  )
}
