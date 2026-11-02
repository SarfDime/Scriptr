import { apiRoutes, withQuery } from '@shared/config/api-routes'
import type {
  LiftedRestrictionItem,
  MyRestriction,
  RestrictionListItem,
  RestrictionLookupResponse,
  RestrictionMutationResponse,
} from '@shared/types/restrictions.types'
import { apiFetchRequired } from './next-api'

const noStore = { cache: 'no-store' } as const

/** Requires a session. Resolves `null` when the caller isn't restricted. */
export const getMyRestriction = () =>
  apiFetchRequired<MyRestriction>(apiRoutes.restrictions.me, {
    ...noStore,
  })

export const getRestrictions = (cookie?: string) =>
  apiFetchRequired<Array<RestrictionListItem>>(apiRoutes.restrictions.index, {
    ...noStore,
    ...(cookie ? { headers: { cookie } } : {}),
  })

export const getLiftedRestrictions = (cookie?: string) =>
  apiFetchRequired<Array<LiftedRestrictionItem>>(
    apiRoutes.restrictions.lifted,
    { ...noStore, ...(cookie ? { headers: { cookie } } : {}) }
  )

export const lookupRestriction = (query: {
  username?: string
  profile_id?: string
}) =>
  apiFetchRequired<RestrictionLookupResponse>(
    withQuery(apiRoutes.restrictions.lookup, query),
    noStore
  )

export const applyRestriction = (profileId: string, reason: string) =>
  apiFetchRequired<RestrictionMutationResponse>(
    apiRoutes.restrictions.byProfileId(profileId),
    {
      method: 'PUT',
      body: { reason },
    }
  )

export const liftRestriction = (profileId: string) =>
  apiFetchRequired<{ success: true }>(
    apiRoutes.restrictions.byProfileId(profileId),
    { method: 'DELETE' }
  )
