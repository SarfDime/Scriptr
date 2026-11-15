import type { ProfileCore } from '@shared/types/profile.types'
import type { SubjectById } from '@/types/academics/subject.types'
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

/** What both profile loaders hand their page: the shared view model without
 * `isOwner`, which the page adds — `/user` is always the owner, and the public
 * page redirects an owner to `/user` before loading anything. */
export type ProfilePageViewModel = Omit<ProfilePageProps, 'isOwner'>
