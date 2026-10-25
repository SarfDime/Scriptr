import type { ProfileCore } from '@shared/types/profile.types'
import type { SubjectById } from '@/types/academics/subject.types'
import type { StudyTipData } from '@/types/components/StudyTipCard.types'
import type { ProfileAcademics } from './ProfileCard.types'

/** The two lists behind a profile's subjects section. */
export type ProfileSubjectSections = {
  completed: Array<SubjectById>
  currentlyTaking: Array<SubjectById>
}

export type ProfileSubjectsSidebarProps = ProfileSubjectSections & {
  /** Defaults to the signed-in user's "Your subjects". */
  title?: string
  /** Today's study tip; the tip card is omitted without it. */
  studyTip?: StudyTipData
}

/** View model shared by the signed-in user's profile and the public one. */
export type ProfilePageProps = {
  profile: ProfileCore
  academics: ProfileAcademics
  subjects: ProfileSubjectSections
  authoredCount: number
  commentCount: number
  /** The signed-in user's own profile: adds the edit actions and keeps
   * the "Your subjects" title. */
  isOwner?: boolean
  studyTip?: StudyTipData
}
