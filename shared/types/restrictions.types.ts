import type { Tables } from './database.types'

/** `GET /api/restrictions/me`: the caller's own restriction row, or `null`
 * when they aren't restricted (the row's presence is the restriction). */
export type MyRestriction = Pick<
  Tables<'profile_restrictions'>,
  'profile_id' | 'restricted_by' | 'reason' | 'created_at'
> | null
