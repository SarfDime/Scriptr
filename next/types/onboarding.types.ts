import type { OnboardingCatalogQueryResult } from '@shared/types/sanity.types'
import type { WithResolvedSanityData } from '@shared/types/sanity-transform.types'

type ResolvedOnboardingCatalog = NonNullable<
  WithResolvedSanityData<OnboardingCatalogQueryResult>
>

export type OnboardingOption = { id: string; name: string }

export type OnboardingUniversity = {
  _id: string
  dbId?: string
  name: string
  slug: string | null
}

export type OnboardingFaculty = {
  _id: string
  dbId?: string
  name: string
  slug: string | null
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
  /** Elective subjects have no fixed semester or year in the curriculum; the
   * badge is how the picker tells them apart. */
  elective?: boolean | null
  studyId: string
}

export type OnboardingStudy = {
  _id: string
  dbId?: string
  name: string
  slug: string | null
  /** The study's site handle; its page lives there once it has one. */
  siteSlug?: string | null
  facultyId: string
  subjectsByYear: Array<OnboardingSubjectGroup>
}

export type OnboardingCatalog = {
  universities: Array<OnboardingUniversity>
  faculties: Array<OnboardingFaculty>
  studies: Array<OnboardingStudy>
  subjects: ResolvedOnboardingCatalog['subjects']
}

/** The academic profile pickers' state for one study: what an academic setup
 * form edits, in Sanity ids (the shape the pickers render). */
export type AcademicSelections = {
  universityId: string | null
  facultyId: string | null
  studyId: string | null
  completedSubjectIds: Array<string>
  completedYears: Array<number>
}

/** What a display-only consumer renders before (or without) the catalog. */
export const EMPTY_ONBOARDING_CATALOG: OnboardingCatalog = {
  universities: [],
  faculties: [],
  studies: [],
  subjects: [],
}

export type OnboardingSelectStepProps = {
  title: string
  options: Array<OnboardingOption>
  selectedId: string | null
  onSelect: (id: string) => void
  disabledReason?: string
}
