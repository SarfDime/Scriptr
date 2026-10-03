import type { SessionUserSubject } from '@shared/types/auth.types'
import { fetchSanityData } from '@/sanity/lib/utils'
import { subjectByIdQuery } from '@/sanity/queries/academics/subject.queries'
import type { SubjectById } from '@/types/academics/subject.types'
import type { OnboardingCatalog } from '@/types/onboarding.types'

async function getOnboardingCatalog() {
  const { onboardingCatalogQuery } = await import(
    '@/sanity/queries/onboarding.queries'
  )

  return fetchSanityData<OnboardingCatalog>({
    query: onboardingCatalogQuery,
    fetchOrigin: 'profile-subject-catalog',
  })
}

export async function getCurrentlyTakingSubjects(
  selections: Array<SessionUserSubject>
): Promise<Array<SubjectById>> {
  const currentSubjectIds = selections
    .filter((subject) => subject.status === 'currently_taking')
    .map(({ subject_id }) => subject_id)

  return (
    await Promise.all(
      currentSubjectIds.map((subjectId) =>
        fetchSanityData<SubjectById | null>({
          query: subjectByIdQuery,
          params: { subjectId },
          fetchOrigin: `profile-subject-${subjectId}`,
        })
      )
    )
  ).filter((subject): subject is SubjectById => subject !== null)
}

export async function getIncompleteSubjectIdsForStudies(
  studyIds: Array<string>,
  selections: Array<SessionUserSubject>
): Promise<Array<string>> {
  if (studyIds.length === 0) return []

  const catalog = await getOnboardingCatalog()
  const selectedStudyIds = new Set(studyIds)
  const selectedSanityStudyIds = new Set(
    catalog.studies.flatMap((study) =>
      study.dbId && selectedStudyIds.has(study.dbId) ? [study._id] : []
    )
  )
  const completedSubjectIds = new Set(
    selections
      .filter((subject) => subject.status === 'completed')
      .map(({ subject_id }) => subject_id)
  )

  return catalog.subjects.flatMap((subject) =>
    subject.dbId &&
    selectedSanityStudyIds.has(subject.studyId) &&
    !completedSubjectIds.has(subject.dbId)
      ? [subject.dbId]
      : []
  )
}

export async function getIncompleteSubjectsForStudies(
  studyIds: Array<string>,
  selections: Array<SessionUserSubject>
): Promise<Array<SubjectById>> {
  const subjectIds = await getIncompleteSubjectIdsForStudies(
    studyIds,
    selections
  )

  return (
    await Promise.all(
      subjectIds.map((subjectId) =>
        fetchSanityData<SubjectById | null>({
          query: subjectByIdQuery,
          params: { subjectId },
          fetchOrigin: `profile-incomplete-subject-${subjectId}`,
        })
      )
    )
  ).filter((subject): subject is SubjectById => subject !== null)
}
