import type { StudyRole } from './profile.types'

/** One study the caller may manage, as the admin switcher lists it. */
export type AdminStudyOption = {
  id: string
  name: string
  siteSlug: string | null
  facultyName: string
  universityName: string
  /** `owner` covers every study; the other two are scoped to this one. */
  role: StudyRole | 'owner'
}

export type AdminStudiesResponse = {
  studies: Array<AdminStudyOption>
}

export type AdminStudyRoleResponse = {
  success: boolean
  studyRole: { studyId: string; role: StudyRole }
}
