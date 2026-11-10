'use server'

import { cookies } from 'next/headers'
import { ADMIN_STUDY_COOKIE } from '@/lib/admin-study'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/**
 * Remembers which study the admin pages act on. Written as a cookie so every
 * admin page reads the same choice without the URL carrying it; HttpOnly
 * because only the server needs it back.
 */
export const selectAdminStudy = async (studyId: string) => {
  const store = await cookies()
  store.set(ADMIN_STUDY_COOKIE, studyId, {
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
    sameSite: 'lax',
  })
}
