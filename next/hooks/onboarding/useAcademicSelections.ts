'use client'

import type {
  AcademicSelections,
  OnboardingCatalog,
} from '@/types/onboarding.types'

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

  const completeYear = (year: number) => {
    const yearSubjectIds = (subjectsByYearMap.get(year) ?? []).map((s) => s._id)
    update({
      completedYears: Array.from(new Set([...data.completedYears, year])),
      completedSubjectIds: Array.from(
        new Set([...data.completedSubjectIds, ...yearSubjectIds])
      ),
    })
  }

  const uncompleteYear = (year: number) => {
    const yearSubjectIds = new Set(
      (subjectsByYearMap.get(year) ?? []).map((s) => s._id)
    )
    update({
      completedYears: data.completedYears.filter((y) => y !== year),
      completedSubjectIds: data.completedSubjectIds.filter(
        (id) => !yearSubjectIds.has(id)
      ),
    })
  }

  // Completing every subject in a year individually also marks the year
  // complete. Uncompleting any one subject clears the year-complete flag
  // for the year it belongs to. Keeps `completedYears` and
  // `completedSubjectIds` consistent regardless of which path is used.
  const completeSubject = (subjectId: string) => {
    if (data.completedSubjectIds.includes(subjectId)) return

    const subject = subjects.find((s) => s._id === subjectId)
    if (!subject) return

    const nextCompletedSubjectIds = [...data.completedSubjectIds, subjectId]
    const yearSubjectIds = (subjectsByYearMap.get(subject.year) ?? []).map(
      (s) => s._id
    )
    const isYearNowComplete = yearSubjectIds.every((id) =>
      nextCompletedSubjectIds.includes(id)
    )

    update({
      completedSubjectIds: nextCompletedSubjectIds,
      completedYears: isYearNowComplete
        ? Array.from(new Set([...data.completedYears, subject.year]))
        : data.completedYears,
    })
  }

  const uncompleteSubject = (subjectId: string) => {
    const subject = subjects.find((s) => s._id === subjectId)

    update({
      completedSubjectIds: data.completedSubjectIds.filter(
        (id) => id !== subjectId
      ),
      completedYears: subject
        ? data.completedYears.filter((y) => y !== subject.year)
        : data.completedYears,
    })
  }

  return {
    selectUniversity,
    selectFaculty,
    selectStudy,
    completeYear,
    uncompleteYear,
    completeSubject,
    uncompleteSubject,
    catalog: {
      faculties,
      studies,
      subjects,
      subjectsByYear: subjectsByYearMap,
    },
  }
}
