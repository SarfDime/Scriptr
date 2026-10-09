import type { ProfileCore } from '@shared/types/profile.types'

/**
 * A profile can have multiple selected faculties/studies (see
 * ProfileCore.selected_faculties/selected_studies), but display surfaces
 * like ProfileCard show one. This picks the first faculty selection, or
 * failing that, the faculty of the first study selection — same fallback
 * `user/page.tsx` already used inline, now shared so any page rendering a
 * profile (own or someone else's) resolves it the same way.
 */
export const getPrimaryFaculty = (profile: ProfileCore) =>
  profile.selected_faculties[0]?.faculty ??
  profile.selected_studies[0]?.study?.faculty ??
  null

/** full_name is optional on the profiles table; username always exists. */
export const getDisplayName = (
  profile: Pick<ProfileCore, 'full_name' | 'username'>
) => profile.full_name || profile.username

/** Empty string, not null, so it drops straight into ProfileCard's
 * `university: string` prop without an extra `?? ''` at each call site. */
export const getUniversityName = (profile: ProfileCore) =>
  getPrimaryFaculty(profile)?.university?.name ?? ''

export const getUniversityId = (profile: ProfileCore) =>
  getPrimaryFaculty(profile)?.university?.id

export const getFacultyName = (profile: ProfileCore) =>
  getPrimaryFaculty(profile)?.name ?? ''
