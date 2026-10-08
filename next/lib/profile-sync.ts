import type { RegistrationAcademicProfile } from '@shared/types/auth.types'
import type {
  MyProfileResponse,
  ProfileSubjectStatus,
} from '@shared/types/profile.types'
import {
  addProfileFaculty,
  addProfileStudy,
  getMyProfile,
  setProfileSubjectStatus,
} from '@/lib/api/profile-api'
import type {
  GuestAcademicData,
  OnboardingCatalog,
} from '@/types/onboarding.types'

type ResolvedSelections = {
  facultyId: string
  studyId: string | null
  subjectIds: Array<string>
}

const dbIdOf = (
  items: Array<{ _id: string; dbId?: string }>,
  id: string | null
) => items.find((item) => item._id === id)?.dbId ?? null

/** An account "already set up" means don't touch it — guest picks are
 * discarded in favor of whatever the account already has. */
export const accountHasAcademicData = (profile: MyProfileResponse) =>
  profile.selected_faculties.length > 0

/** Guest data holds Sanity _ids (see onboardingCatalogQuery); the API
 * wants Postgres ids (dbId). Returns null if the guest's chosen faculty
 * was never synced to the DB (dbId missing) — nothing to send in that case. */
export const resolveGuestSelections = (
  catalog: OnboardingCatalog,
  guest: GuestAcademicData
): ResolvedSelections | null => {
  const facultyId = dbIdOf(catalog.faculties, guest.facultyId)
  if (!facultyId) return null

  return {
    facultyId,
    studyId: dbIdOf(catalog.studies, guest.studyId),
    subjectIds: guest.completedSubjectIds
      .map((id) => dbIdOf(catalog.subjects, id))
      .filter((id): id is string => id !== null),
  }
}

export const getRegistrationAcademicProfile = (
  catalog: OnboardingCatalog,
  guest: GuestAcademicData
): RegistrationAcademicProfile | null => {
  if (!guest.onboardingCompletedAt) return null

  const selections = resolveGuestSelections(catalog, guest)
  if (!selections) return null
  if (
    selections.subjectIds.length !== guest.completedSubjectIds.length ||
    (selections.subjectIds.length > 0 && !selections.studyId)
  ) {
    return null
  }

  return {
    facultyId: selections.facultyId,
    studyId: selections.studyId,
    completedSubjectIds: selections.subjectIds,
  }
}

/** Saves a completed authenticated onboarding flow to the account profile.
 * Every request is awaited so a failure is surfaced to the modal rather than
 * marking local onboarding complete while the account remains incomplete. */
export const saveAuthenticatedOnboarding = async (
  catalog: OnboardingCatalog,
  guest: GuestAcademicData
) => {
  const academicProfile = getRegistrationAcademicProfile(catalog, {
    ...guest,
    onboardingCompletedAt: guest.onboardingCompletedAt ?? 'pending',
  })
  if (!academicProfile) {
    throw new Error(
      'Your academic selections could not be prepared. Please review them and try again.'
    )
  }

  const profile = await getMyProfile()
  const hasFaculty = profile.selected_faculties.some(
    (selection) => selection.faculty?.id === academicProfile.facultyId
  )
  const hasStudy =
    academicProfile.studyId !== null &&
    profile.selected_studies.some(
      (selection) => selection.study?.id === academicProfile.studyId
    )

  const selectionWrites: Array<Promise<unknown>> = []
  if (!hasFaculty) {
    selectionWrites.push(addProfileFaculty(academicProfile.facultyId))
  }
  if (academicProfile.studyId && !hasStudy) {
    selectionWrites.push(addProfileStudy(academicProfile.studyId))
  }
  await Promise.all(selectionWrites)

  const status: ProfileSubjectStatus = 'completed'
  const existingSubjects = new Set(
    profile.subjects.map((subject) => subject.subject_id)
  )
  await Promise.all(
    academicProfile.completedSubjectIds
      .filter((subjectId) => !existingSubjects.has(subjectId))
      .map((subjectId) => setProfileSubjectStatus(subjectId, status))
  )
}
