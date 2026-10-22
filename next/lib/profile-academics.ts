import type { MyProfileResponse } from '@shared/types/profile.types'
import { findByDbId } from '@/lib/catalog-lookup'
import { dbIdOf } from '@/lib/profile-sync'
import type {
  AcademicSelections,
  OnboardingCatalog,
} from '@/types/onboarding.types'

/**
 * Seeds the academics editor from the account. Profiles store Postgres ids;
 * the catalog (and the shared selection logic) work in Sanity `_id`s, so
 * everything is mapped through `dbId`.
 *
 * The editor models one faculty and one study (what onboarding creates), so
 * if an account somehow holds several, the first is shown and saving
 * replaces them with the one chosen. Only `completed` subjects are seeded;
 * `currently_taking` ones are left alone. Anything that has no catalog
 * entry is skipped, so it is never touched on save. `completedYears` is
 * left empty — the editor derives it from the subjects for the study on
 * screen.
 */
export const buildAcademicSelections = (
  catalog: OnboardingCatalog,
  profile: MyProfileResponse
): AcademicSelections => {
  const faculty = findByDbId(
    catalog.faculties,
    profile.selected_faculties[0]?.faculty?.id
  )
  const study = findByDbId(
    catalog.studies,
    profile.selected_studies[0]?.study?.id
  )

  return {
    universityId: faculty?.universityId ?? null,
    facultyId: faculty?._id ?? null,
    studyId: study?._id ?? null,
    completedSubjectIds: profile.subjects
      .filter((row) => row.status === 'completed')
      .flatMap((row) => {
        const subject = findByDbId(catalog.subjects, row.subject_id)
        return subject ? [subject._id] : []
      }),
    completedYears: [],
  }
}

export type AcademicSavePlan = {
  facultyDbId: string
  studyDbId: string
  /** The account's faculty/study differ from the chosen ones. */
  selectionsChanged: boolean
  /** Subject db ids to set to `completed`. */
  subjectsToComplete: Array<string>
  /** Subject db ids to remove (they were `completed`, no longer are). */
  subjectsToRemove: Array<string>
}

/**
 * What saving the editor would change on the account, as a diff against
 * the profile. Returns null when the choice can't be expressed in db ids —
 * a faculty, study or completed subject that was never synced to the
 * database (no `dbId`), which is the same "could not be prepared" case
 * onboarding reports.
 *
 * Only subjects the catalog knows are ever removed, so completed subjects
 * from another study stay as they are when the study changes.
 */
export const planAcademicSave = (
  catalog: OnboardingCatalog,
  selections: AcademicSelections,
  profile: MyProfileResponse
): AcademicSavePlan | null => {
  const facultyDbId = dbIdOf(catalog.faculties, selections.facultyId)
  const studyDbId = dbIdOf(catalog.studies, selections.studyId)
  if (!facultyDbId || !studyDbId) return null

  const desired = selections.completedSubjectIds.map((id) =>
    dbIdOf(catalog.subjects, id)
  )
  const desiredIds = new Set(desired.filter((id): id is string => id !== null))
  if (desiredIds.size !== desired.length) return null

  const knownIds = new Set(
    catalog.subjects.flatMap((subject) => (subject.dbId ? [subject.dbId] : []))
  )
  const currentIds = new Set(
    profile.subjects
      .filter((row) => row.status === 'completed')
      .map((row) => row.subject_id)
  )

  const currentFacultyIds = profile.selected_faculties.flatMap((row) =>
    row.faculty ? [row.faculty.id] : []
  )
  const currentStudyIds = profile.selected_studies.flatMap((row) =>
    row.study ? [row.study.id] : []
  )

  return {
    facultyDbId,
    studyDbId,
    selectionsChanged:
      currentFacultyIds.length !== 1 ||
      currentFacultyIds[0] !== facultyDbId ||
      currentStudyIds.length !== 1 ||
      currentStudyIds[0] !== studyDbId,
    subjectsToComplete: [...desiredIds].filter((id) => !currentIds.has(id)),
    subjectsToRemove: [...currentIds].filter(
      (id) => knownIds.has(id) && !desiredIds.has(id)
    ),
  }
}
