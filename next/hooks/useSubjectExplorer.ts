'use client'

import { fuzzySearch } from '@shared/utils/array-utils/search'
import { type SortRule, sortArray } from '@shared/utils/array-utils/sort'
import { useState } from 'react'
import type { MinimalSubject } from '@/types/academics/subject.types'
import { useSubjectFilters } from './useSubjectFilters'

export type SubjectSortOption =
  | 'Semester'
  | 'Semester Desc'
  | 'Subject A-Z'
  | 'Professor A-Z'

type ExtendedSubject = MinimalSubject & { primaryProfessor: string }

const getPrimaryProfessorName = (subject: MinimalSubject) =>
  subject.professors?.[0]?.name ?? ''

const SORT_RULES: Record<
  SubjectSortOption,
  Array<SortRule<ExtendedSubject>>
> = {
  Semester: [
    { key: 'semester', direction: 'asc' },
    { key: 'name', direction: 'asc' },
  ],
  'Semester Desc': [
    { key: 'semester', direction: 'desc' },
    { key: 'name', direction: 'asc' },
  ],
  'Subject A-Z': [{ key: 'name', direction: 'asc' }],
  'Professor A-Z': [{ key: 'primaryProfessor', direction: 'asc' }],
}

/** The explorer's search and sort over the shared year/electives filters. */
export const useSubjectExplorer = (subjects: Array<MinimalSubject>) => {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SubjectSortOption>('Semester')

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
    visibleSubjects: sortArray(matched, SORT_RULES[sort]),
  }
}
