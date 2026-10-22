/** One academic affiliation on the profile card. `href` is null when the
 * catalog has no slug path for it, in which case it renders as plain text. */
export type ProfileAcademicEntry = {
  id: string
  name: string
  href: string | null
}

export type ProfileAcademics = {
  universities: Array<ProfileAcademicEntry>
  faculties: Array<ProfileAcademicEntry>
  studies: Array<ProfileAcademicEntry>
}
