import type { SessionUserSubject } from '@shared/types/auth.types'
import type { OnboardingCatalog } from '@/types/onboarding.types'

/**
 * The pure half of the account → subject-catalog mapping, split out of
 * `profile-subjects.ts` because the browser needs it too: the header alert
 * derives "subjects this reader still has to take" from the session and the
 * onboarding catalog it already holds. Nothing here touches Sanity or the
 * request, so both sides run the same code.
 */

/** The part of a subject selection both the session and a profile row carry. */
export type SubjectSelection = Pick<SessionUserSubject, 'subject_id' | 'status'>

/**
 * Postgres ids of every subject belonging to the given studies. Studies are
 * matched through `dbId` — a study that was never synced has no database id and
 * cannot match — and every subject of a matched study is included.
 */
export const studySubjectDbIds = (
  catalog: OnboardingCatalog,
  studyDbIds: ReadonlyArray<string>
): Array<string> => {
  if (studyDbIds.length === 0) return []

  const selectedStudyDbIds = new Set(studyDbIds)
  const selectedSanityStudyIds = new Set(
    catalog.studies.flatMap((study) =>
      study.dbId && selectedStudyDbIds.has(study.dbId) ? [study._id] : []
    )
  )

  return catalog.subjects.flatMap((subject) =>
    subject.dbId && selectedSanityStudyIds.has(subject.study._id)
      ? [subject.dbId]
      : []
  )
}

export const completedSubjectDbIds = (
  selections: ReadonlyArray<SubjectSelection>
): Set<string> =>
  new Set(
    selections
      .filter((subject) => subject.status === 'completed')
      .map(({ subject_id }) => subject_id)
  )

/**
 * Ids of the subjects of the given studies that aren't completed. Derived from
 * the study rather than read from stored `currently_taking` rows, which aren't
 * reliable for it: registration writes them for the rest of the chosen study,
 * but accounts set up later (the onboarding sync, the academics editor) only
 * get `completed` rows, and subjects added to a study afterwards have no row at
 * all. So every subject of a study someone is enrolled in that isn't completed
 * counts as one they are taking.
 */
export const deriveIncompleteSubjectDbIds = (
  catalog: OnboardingCatalog,
  studyDbIds: ReadonlyArray<string>,
  selections: ReadonlyArray<SubjectSelection>
): Array<string> => {
  const completed = completedSubjectDbIds(selections)

  return studySubjectDbIds(catalog, studyDbIds).filter(
    (subjectId) => !completed.has(subjectId)
  )
}
