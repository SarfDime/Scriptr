import { fetchSanityData } from '@/sanity/lib/utils'
import { subjectByIdQuery } from '@/sanity/queries/academics/subject.queries'
import type { SubjectById } from '@/types/academics/subject.types'
import type { ProfileSubjectSections } from '@/types/components/ProfilePage.types'
import type { OnboardingCatalog } from '@/types/onboarding.types'
import {
  completedSubjectDbIds,
  deriveIncompleteSubjectDbIds,
  type SubjectSelection,
  studySubjectDbIds,
} from './study-subjects'

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

/** Completed subjects that belong to the given studies. */
export async function getCompletedSubjectsForStudies(
  studyIds: Array<string>,
  selections: Array<SubjectSelection>
): Promise<Array<SubjectById>> {
  if (studyIds.length === 0) return []

  const completedSubjectIds = completedSubjectDbIds(selections)
  const catalog = await getOnboardingCatalog()
  const subjectIds = studySubjectDbIds(catalog, studyIds).filter((subjectId) =>
    completedSubjectIds.has(subjectId)
  )

  return fetchSubjects(subjectIds, 'profile-subject')
}

/**
 * Ids of the subjects of the given studies that aren't completed — the pure
 * derivation lives in `study-subjects.ts` so the browser can run it too.
 */
export async function getIncompleteSubjectIdsForStudies(
  studyIds: Array<string>,
  selections: Array<SubjectSelection>
): Promise<Array<string>> {
  if (studyIds.length === 0) return []

  const catalog = await getOnboardingCatalog()

  return deriveIncompleteSubjectDbIds(catalog, studyIds, selections)
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
