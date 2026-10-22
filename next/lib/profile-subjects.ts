import type { SessionUserSubject } from '@shared/types/auth.types'
import { fetchSanityData } from '@/sanity/lib/utils'
import { subjectByIdQuery } from '@/sanity/queries/academics/subject.queries'
import type { SubjectById } from '@/types/academics/subject.types'
import type { ProfileSubjectSections } from '@/types/components/ProfilePage.types'
import type { OnboardingCatalog } from '@/types/onboarding.types'

/** The part of a subject selection these helpers read — satisfied by both
 * the session's subjects and a profile's `subjects` rows. */
type SubjectSelection = Pick<SessionUserSubject, 'subject_id' | 'status'>

export async function getOnboardingCatalog() {
  const { onboardingCatalogQuery } = await import(
    '@/sanity/queries/onboarding.queries'
  )

  return fetchSanityData<OnboardingCatalog>({
    query: onboardingCatalogQuery,
    fetchOrigin: 'profile-subject-catalog',
  })
}

async function fetchSubjects(
  subjectIds: Array<string>,
  fetchOriginPrefix: string
): Promise<Array<SubjectById>> {
  return (
    await Promise.all(
      subjectIds.map((subjectId) =>
        fetchSanityData<SubjectById | null>({
          query: subjectByIdQuery,
          params: { subjectId },
          fetchOrigin: `${fetchOriginPrefix}-${subjectId}`,
        })
      )
    )
  ).filter((subject): subject is SubjectById => subject !== null)
}

const getCompletedSubjectIds = (selections: Array<SubjectSelection>) =>
  new Set(
    selections
      .filter((subject) => subject.status === 'completed')
      .map(({ subject_id }) => subject_id)
  )

async function getSelectedStudySubjectIds(
  studyIds: Array<string>
): Promise<Array<string>> {
  if (studyIds.length === 0) return []

  const catalog = await getOnboardingCatalog()
  const selectedStudyIds = new Set(studyIds)
  const selectedSanityStudyIds = new Set(
    catalog.studies.flatMap((study) =>
      study.dbId && selectedStudyIds.has(study.dbId) ? [study._id] : []
    )
  )

  return catalog.subjects.flatMap((subject) =>
    subject.dbId && selectedSanityStudyIds.has(subject.study._id)
      ? [subject.dbId]
      : []
  )
}

/** Completed subjects that belong to the given studies. */
export async function getCompletedSubjectsForStudies(
  studyIds: Array<string>,
  selections: Array<SubjectSelection>
): Promise<Array<SubjectById>> {
  const completedSubjectIds = getCompletedSubjectIds(selections)
  const subjectIds = (await getSelectedStudySubjectIds(studyIds)).filter(
    (subjectId) => completedSubjectIds.has(subjectId)
  )

  return fetchSubjects(subjectIds, 'profile-subject')
}

/**
 * Ids of the subjects of the given studies that aren't completed. This is
 * derived from the study rather than read from stored `currently_taking`
 * rows, which aren't reliable for it: registration writes them for the rest
 * of the chosen study, but accounts set up later (the onboarding sync, the
 * academics editor) only get `completed` rows, and subjects added to a study
 * afterwards have no row at all. So every subject of a study someone is
 * enrolled in that isn't completed counts as one they are taking.
 */
export async function getIncompleteSubjectIdsForStudies(
  studyIds: Array<string>,
  selections: Array<SubjectSelection>
): Promise<Array<string>> {
  const completedSubjectIds = getCompletedSubjectIds(selections)

  return (await getSelectedStudySubjectIds(studyIds)).filter(
    (subjectId) => !completedSubjectIds.has(subjectId)
  )
}

export async function getIncompleteSubjectsForStudies(
  studyIds: Array<string>,
  selections: Array<SubjectSelection>
): Promise<Array<SubjectById>> {
  const subjectIds = await getIncompleteSubjectIdsForStudies(
    studyIds,
    selections
  )

  return fetchSubjects(subjectIds, 'profile-incomplete-subject')
}

/**
 * The two lists behind a profile's subjects section, both limited to the
 * subjects of the given studies: the completed ones, and everything else,
 * which is shown as currently taking.
 */
export async function getProfileSubjectSections(
  studyIds: Array<string>,
  selections: Array<SubjectSelection>
): Promise<ProfileSubjectSections> {
  const [completed, currentlyTaking] = await Promise.all([
    getCompletedSubjectsForStudies(studyIds, selections),
    getIncompleteSubjectsForStudies(studyIds, selections),
  ])

  return { completed, currentlyTaking }
}
