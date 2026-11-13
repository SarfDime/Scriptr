import type { ProfileCore } from '@shared/types/profile.types'
import type { SubjectById } from '@/types/academics/subject.types'
import type { OnboardingCatalog } from '@/types/onboarding.types'
import type { ProfileAcademics } from './ProfileCard.types'

/** The two lists behind a profile's subjects section. */
export type ProfileSubjectSections = {
  completed: Array<SubjectById>
  currentlyTaking: Array<SubjectById>
}

export type ProfileSubjectsSidebarProps = ProfileSubjectSections & {
  /** Defaults to the signed-in user's "Your subjects". */
  title?: string
}

/** View model shared by the signed-in user's profile and the public one. */
export type ProfilePageProps = {
  profile: ProfileCore
  academics: ProfileAcademics
  /** The academic profile's subject list. Omitted only when the caller has no
   * subject read (the study site narrows it to its own study). */
  subjects?: ProfileSubjectSections
  /** Omitted when the stats read failed; the activity strip is then skipped
   * rather than rendered with invented zeros. */
  authoredCount?: number
  commentCount?: number
  /** The signed-in user's own profile: adds the edit actions and keeps
   * the "Your subjects" title. */
  isOwner?: boolean
}

/** What `loadPublicProfilePage` hands the `/user/[username]` page: the shared
 * profile view model without `isOwner`, since an owner is redirected to
 * `/user` before anything is loaded. */
export type PublicProfilePageViewModel = Omit<ProfilePageProps, 'isOwner'>

/** What `loadMyProfilePage` hands the `/user` page. The profile itself is not
 * here: that page reads the shared profile state so an edit shows up in place.
 * The catalog is, because the affiliations' names and links resolve through it
 * (Postgres holds ids and names, not slugs) and reading it on the server keeps
 * the catalog out of the client bundle's data fetches. */
export type MyProfilePageViewModel = {
  catalog: OnboardingCatalog | null
  /** Every study's subjects, filtered in place by the sidebar. */
  subjects: ProfileSubjectSections
}
