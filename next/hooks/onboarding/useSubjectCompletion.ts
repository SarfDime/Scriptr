'use client'

import type { AcademicSelections } from '@/types/onboarding.types'

/** The two fields the year/subject completion rules keep in step. */
export type SubjectCompletion = Pick<
  AcademicSelections,
  'completedYears' | 'completedSubjectIds'
>

type SubjectLike = { _id: string; year: number }

/**
 * The year and subject completion rules, shared by the onboarding wizard and
 * the study's academic-setup page: a subject and its year stay consistent
 * whichever path the reader takes (whole year, or individual subjects until the
 * year happens to be complete), and the ids are Sanity `_id`s because that is
 * what the pickers render next to.
 */
export const useSubjectCompletion = (
  subjectsByYear: Map<number, Array<SubjectLike>>,
  data: SubjectCompletion,
  update: (patch: Partial<SubjectCompletion>) => void
) => {
  const subjects = [...subjectsByYear.values()].flat()

  const completeYear = (year: number) => {
    const yearSubjectIds = (subjectsByYear.get(year) ?? []).map((s) => s._id)
    update({
      completedYears: Array.from(new Set([...data.completedYears, year])),
      completedSubjectIds: Array.from(
        new Set([...data.completedSubjectIds, ...yearSubjectIds])
      ),
    })
  }

  const uncompleteYear = (year: number) => {
    const yearSubjectIds = new Set(
      (subjectsByYear.get(year) ?? []).map((s) => s._id)
    )
    update({
      completedYears: data.completedYears.filter((y) => y !== year),
      completedSubjectIds: data.completedSubjectIds.filter(
        (id) => !yearSubjectIds.has(id)
      ),
    })
  }

  /** Completing every subject in a year individually also marks the year
   * complete, so the two fields never disagree. */
  const completeSubject = (subjectId: string) => {
    if (data.completedSubjectIds.includes(subjectId)) return

    const subject = subjects.find((s) => s._id === subjectId)
    if (!subject) return

    const nextCompletedSubjectIds = [...data.completedSubjectIds, subjectId]
    const yearSubjectIds = (subjectsByYear.get(subject.year) ?? []).map(
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

  /** Uncompleting any one subject clears the year-complete flag for its year. */
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
    completeYear,
    uncompleteYear,
    completeSubject,
    uncompleteSubject,
  }
}
