'use client'

import { fuzzySearch } from '@shared/utils/array-utils/search'
import { useState } from 'react'
import type { MinimalSubject } from '@/types/academics/subject.types'
import { useSubjectFilters } from './useSubjectFilters'
import { sortSubjects, useSubjectSort } from './useSubjectSort'

const getPrimaryProfessorName = (subject: MinimalSubject) =>
  subject.professors?.[0]?.name ?? ''

/** The explorer's search and sort over the shared year/electives filters. */
export const useSubjectExplorer = (subjects: Array<MinimalSubject>) => {
  const [query, setQuery] = useState('')
  const { sort, setSort } = useSubjectSort()

  const subjectsWithProf = subjects.map((subject) => ({
    ...subject,
    primaryProfessor: getPrimaryProfessorName(subject),
  }))

  const {
    year,
    setYear,
    years,
    includeElectives,
    setIncludeElectives,
    visibleSubjects: filteredSubjects,
  } = useSubjectFilters(subjectsWithProf)

  const matched = fuzzySearch(filteredSubjects, query, [
    { key: 'name', weight: 3 },
    { key: 'code', weight: 2 },
    { key: 'primaryProfessor', weight: 1.5 },
  ])

  return {
    query,
    setQuery,
    year,
    setYear,
    years,
    includeElectives,
    setIncludeElectives,
    sort,
    setSort,
    visibleSubjects: sortSubjects(matched, sort),
  }
}
