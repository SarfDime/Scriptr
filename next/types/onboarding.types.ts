import type { OnboardingCatalogQueryResult } from '@shared/types/sanity.types'
import type { WithResolvedSanityData } from '@shared/types/sanity-transform.types'

type ResolvedOnboardingCatalog = NonNullable<
  WithResolvedSanityData<OnboardingCatalogQueryResult>
>

export type OnboardingOption = { id: string; name: string }

export type OnboardingUniversity = { _id: string; dbId?: string; name: string }

export type OnboardingFaculty = {
  _id: string
  dbId?: string
  name: string
  universityId: string
}

export type OnboardingSubjectGroup = {
  year: number
  subjects: Array<OnboardingSubject>
}
export type OnboardingSubject = {
  _id: string
  dbId?: string
  name: string
  year: number
  studyId: string
}

export type OnboardingStudy = {
  _id: string
  dbId?: string
  name: string
  facultyId: string
  subjectsByYear: Array<OnboardingSubjectGroup>
}

export type OnboardingCatalog = {
  universities: Array<OnboardingUniversity>
  faculties: Array<OnboardingFaculty>
  studies: Array<OnboardingStudy>
  subjects: ResolvedOnboardingCatalog['subjects']
}

export type GuestAcademicData = {
  universityId: string | null
  facultyId: string | null
  studyId: string | null
  completedSubjectIds: Array<string>
  completedYears: Array<number>
  onboardingCompletedAt: string | null
  onboardingDismissedAt: string | null
}

export const EMPTY_GUEST_ACADEMIC_DATA: GuestAcademicData = {
  universityId: null,
  facultyId: null,
  studyId: null,
  completedSubjectIds: [],
  completedYears: [],
  onboardingCompletedAt: null,
  onboardingDismissedAt: null,
}

export type OnboardingSelectStepProps = {
  title: string
  description: string
  options: Array<OnboardingOption>
  selectedId: string | null
  onSelect: (id: string) => void
  disabledReason?: string
}
