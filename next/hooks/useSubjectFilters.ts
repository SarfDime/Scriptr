'use client'

import { useState } from 'react'

/** The two fields every subject list can filter on. */
export type FilterableSubject = {
  year: number
  elective?: boolean | null
}

/**
 * The year/electives filters every subject list shares.
 *
 * There is no "all years": a list always shows one year. The year defaults to
 * the first one the list actually has — year 1 whenever it is present — so the
 * picker never opens on a year the list cannot show. The pick is kept as state
 * but resolved against the list on every render, so when the list changes
 * (another study, a refreshed profile) and the picked year is gone, the first
 * available year wins without an effect to sync it.
 *
 * Electives are included by default; the toggle hides them rather than opting
 * in, because they are part of the year's curriculum.
 */
export const useSubjectFilters = <T extends FilterableSubject>(
  subjects: Array<T>
) => {
  const years = [...new Set(subjects.map((subject) => subject.year))].sort(
    (a, b) => a - b
  )

  const [pickedYear, setPickedYear] = useState<number | null>(null)
  const [includeElectives, setIncludeElectives] = useState(false)

  const year =
    pickedYear !== null && years.includes(pickedYear)
      ? pickedYear
      : (years[0] ?? 1)

  const visibleSubjects = subjects.filter(
    (subject) =>
      subject.year === year && (includeElectives || !subject.elective)
  )

  return {
    year,
    setYear: setPickedYear,
    years,
    includeElectives,
    setIncludeElectives,
    visibleSubjects,
  }
}
