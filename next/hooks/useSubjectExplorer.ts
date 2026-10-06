'use client'

import { filterByWeight } from '@shared/utils/array-utils/filter'
import { fuzzySearch } from '@shared/utils/array-utils/search'
import { type SortRule, sortArray } from '@shared/utils/array-utils/sort'
import { useState } from 'react'
import type { MinimalSubject } from '@/types/academics/subject.types'

export type SubjectSortOption = 'Year' | 'Subject A-Z' | 'Professor A-Z'

type ExtendedSubject = MinimalSubject & { primaryProfessor: string }

const getPrimaryProfessorName = (subject: MinimalSubject) =>
  subject.professors?.[0]?.name ?? ''

const SORT_RULES: Record<
  SubjectSortOption,
  Array<SortRule<ExtendedSubject>>
> = {
  Year: [
    { key: 'year', direction: 'asc' },
    { key: 'name', direction: 'asc' },
  ],
  'Subject A-Z': [{ key: 'name', direction: 'asc' }],
  'Professor A-Z': [{ key: 'primaryProfessor', direction: 'asc' }],
}

export const useSubjectExplorer = (subjects: Array<MinimalSubject>) => {
  const [query, setQuery] = useState('')
  const [year, setYear] = useState<number | 'all'>('all')
  const [sort, setSort] = useState<SubjectSortOption>('Year')

  const yearOptions = Array.from(
    new Set(subjects.map((subject) => subject.year))
  ).sort((a, b) => a - b)

  const subjectsWithProf = subjects.map((subject) => ({
    ...subject,
    primaryProfessor: getPrimaryProfessorName(subject),
  }))

  const byYear =
    year !== 'all'
      ? filterByWeight(
          subjectsWithProf,
          [
            {
              key: 'year',
              predicate: (val) => val === year,
              weight: 1,
            },
          ],
          1
        )
      : subjectsWithProf

  const matched = fuzzySearch(byYear, query, [
    { key: 'name', weight: 3 },
    { key: 'code', weight: 2 },
    { key: 'primaryProfessor', weight: 1.5 },
  ])

  const visibleSubjects = sortArray(matched, SORT_RULES[sort])

  return {
    query,
    setQuery,
    year,
    setYear,
    sort,
    setSort,
    yearOptions,
    visibleSubjects,
  }
}
