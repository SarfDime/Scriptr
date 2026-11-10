import 'server-only'

import { cookies } from 'next/headers'
import { ADMIN_STUDY_COOKIE } from './admin-study'
import { getAdminStudies } from './api/admin-studies-api'

/**
 * The study the admin pages act on. A preference, not a credential — the API
 * authorizes every request on its own — but it has to be one the caller holds a
 * role on, or the study-scoped routes answer 403.
 *
 * An owner with no choice reviews every study (`null`); everyone else falls back
 * to the first study they administer, so a fresh operator is never left without
 * a scope. A cookie naming a study they no longer hold is ignored the same way.
 */
export const getSelectedAdminStudy = async (): Promise<string | null> => {
  const cookieStore = await cookies()
  const value = cookieStore.get(ADMIN_STUDY_COOKIE)?.value
  const studies = await getAdminStudies(cookieStore.toString())

  const chosen = studies.find((study) => study.id === value)
  if (chosen) return chosen.id

  if (studies.some((study) => study.role === 'owner')) return null

  return studies[0]?.id ?? null
}
