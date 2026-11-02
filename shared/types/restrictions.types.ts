import type { Tables } from './database.types'

/** `GET /api/restrictions/me`: the caller's active restriction row, or `null`. */
export type MyRestriction = Pick<
  Tables<'profile_restrictions'>,
  'profile_id' | 'restricted_by' | 'reason' | 'created_at' | 'expires_at'
> | null

export type RestrictionProfileSummary = Pick<
  Tables<'profiles'>,
  'id' | 'username' | 'full_name'
>

export type RestrictionListItem = Pick<
  Tables<'profile_restrictions'>,
  'profile_id' | 'restricted_by' | 'reason' | 'created_at' | 'expires_at'
> & {
  active: boolean
  profile: Pick<Tables<'profiles'>, 'username' | 'full_name'> | null
  restricted_by_profile: Pick<
    Tables<'profiles'>,
    'username' | 'full_name'
  > | null
}

/** One history row that an admin lifted before it expired. */
export type LiftedRestrictionItem = Pick<
  Tables<'profile_restriction_history'>,
  'id' | 'profile_id' | 'restricted_by' | 'reason' | 'created_at' | 'expires_at'
> & {
  lifted_early_at: string
  profile: Pick<Tables<'profiles'>, 'username' | 'full_name'> | null
  restricted_by_profile: Pick<
    Tables<'profiles'>,
    'username' | 'full_name'
  > | null
}

export type RestrictionLookupResponse = {
  profile: RestrictionProfileSummary
  prior_count: number
  active_restriction: MyRestriction
}

export type RestrictionMutationRecord = Pick<
  Tables<'profile_restrictions'>,
  'profile_id' | 'restricted_by' | 'reason' | 'created_at' | 'expires_at'
>

export type RestrictionMutationResponse = {
  success: true
  restriction: RestrictionMutationRecord
}
