import 'server-only'

import { apiRoutes } from '@shared/config/api-routes'
import type {
  AdminStudiesResponse,
  AdminStudyOption,
} from '@shared/types/admin.types'
import { cache } from 'react'
import { API_URL } from '@/config/env'
import { nextLogs } from '@/lib/logger'

/**
 * The studies the operator may manage, for the switcher. Read with the
 * operator's own cookie, so the API answers from their roles; an unreachable
 * API yields an empty list and the switcher hides rather than failing the page.
 *
 * `cache`-wrapped so the frame, the switcher and the page's loader share one
 * read per request.
 */
export const getAdminStudies = cache(
  async (cookie: string): Promise<Array<AdminStudyOption>> => {
    try {
      const response = await fetch(`${API_URL}${apiRoutes.admin.studies}`, {
        headers: { cookie },
        cache: 'no-store',
      })

      if (!response.ok) return []

      const body = (await response.json()) as AdminStudiesResponse
      return body.studies ?? []
    } catch (error) {
      nextLogs({
        logLevel: 'warn',
        message: 'The admin study list could not be read.',
        error,
      })
      return []
    }
  }
)
