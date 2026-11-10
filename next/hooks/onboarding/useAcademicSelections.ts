'use client'

import type {
  AcademicSelections,
  OnboardingCatalog,
} from '@/types/onboarding.types'
import { useSubjectCompletion } from './useSubjectCompletion'

type CascadeSelections = Pick<
  AcademicSelections,
  'universityId' | 'facultyId' | 'studyId'
>

/**
 * Pure function, no effects: given the catalog and a candidate
 * university/faculty/study selection, auto-fills any level that has
 * exactly one possible option and clears any level that no longer
 * belongs to its parent. Called synchronously from the select* functions
 * below (and once after guest-data hydration, via useMicrotaskEffect) —
 * NOT from a plain useEffect reacting to `faculties`/`studies` changing.
 * An effect that reads `data` and, based on it, calls `update` (itself a
 * setState) is exactly the "effect synchronously updates state" pattern
 * Biome's useReactCompiler lint (nursery, set to "error" in this repo's
 * biome.json) flags — and two such effects (one per level) reacting to
 * the same parent change in the same commit would both read the same
 * not-yet-committed `data` and could race each other. Resolving the
 * whole cascade in one synchronous call, at the exact point something
 * changes, avoids both problems.
 */
export const resolveCascade = (
  catalog: OnboardingCatalog,
  selections: CascadeSelections
): CascadeSelections => {
  let universityId = selections.universityId
  if (!universityId && catalog?.universities.length === 1) {
    universityId = catalog?.universities?.[0]?._id ?? null
  }

  const faculties = catalog.faculties.filter(
    (f) => f.universityId === universityId
  )
  let facultyId = selections.facultyId
  if (facultyId && !faculties.some((f) => f._id === facultyId)) {
    facultyId = null
  }
  if (!facultyId && faculties.length === 1) {
    facultyId = faculties?.[0]?._id ?? null
  }

  const studies =
    catalog?.studies?.filter((s) => s.facultyId === facultyId) ?? []
  let studyId = selections.studyId
  if (studyId && !studies.some((s) => s._id === studyId)) {
    studyId = null
  }
  if (!studyId && studies?.length === 1) {
    studyId = studies?.[0]?._id ?? null
  }

  return { universityId, facultyId, studyId }
}

/**
 * Computes each level's filtered option list from its parent's selection
 * for display, resolves the full university/faculty/study cascade
 * synchronously whenever one of them changes (see resolveCascade above),
 * and provides one-click whole-year completion as well as
 * individual-subject completion.
 *
 * Storage-agnostic: the caller owns `data` and `update`, so the same logic
 * drives the onboarding wizard (guest localStorage) and the profile
 * academics editor (local state seeded from the account). `update` must
 * merge a partial patch into `data`.
 */
export const useAcademicSelections = (
  catalog: OnboardingCatalog,
  data: AcademicSelections,
  update: (patch: Partial<AcademicSelections>) => void
) => {
  const faculties = catalog?.faculties?.filter(
    (f) => f?.universityId === data?.universityId
  )
  const studies = catalog?.studies?.filter(
    (s) => s?.facultyId === data?.facultyId
  )

  const selectedStudy = catalog?.studies?.find((s) => s._id === data.studyId)
  const subjectsByYear = selectedStudy?.subjectsByYear ?? []
  const subjects = subjectsByYear?.flatMap((group) => group?.subjects)

  // Adapter only — grouping itself now happens in the GROQ query, not here.
  const subjectsByYearMap = new Map(
    subjectsByYear?.map((group) => [group?.year, group?.subjects])
  )

  const selectUniversity = (universityId: string) => {
    update(
      resolveCascade(catalog, {
        universityId,
        facultyId: null,
        studyId: null,
      })
    )
  }

  const selectFaculty = (facultyId: string) => {
    update(
      resolveCascade(catalog, {
        universityId: data.universityId,
        facultyId,
        studyId: null,
      })
    )
  }

  const selectStudy = (studyId: string) => {
    update({ studyId })
  }

  const completion = useSubjectCompletion(subjectsByYearMap, data, update)

  return {
    ...completion,
    selectUniversity,
    selectFaculty,
    selectStudy,
    catalog: {
      faculties,
      studies,
      subjects,
      subjectsByYear: subjectsByYearMap,
    },
  }
}
