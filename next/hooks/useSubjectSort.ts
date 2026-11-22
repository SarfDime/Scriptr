'use client'

import { type SortDirection, sortArray } from '@shared/utils/array-utils/sort'
import { useState } from 'react'
import type { MinimalSubject } from '@/types/academics/subject.types'
import type { FilterableSubject } from './useSubjectFilters'

export type SubjectSortOption = 'Semester' | 'Semester Desc' | 'Title A-Z'

/** What the sort reads: the shared filters' fields plus the subject's name
 * and semester. */
type SortableSubject = FilterableSubject &
  Pick<MinimalSubject, 'name' | 'semester'>

type SortKey = 'semester' | 'name'

const SORT_RULES: Record<
  SubjectSortOption,
  ReadonlyArray<{ key: SortKey; direction?: SortDirection }>
> = {
  Semester: [
    { key: 'semester', direction: 'asc' },
    { key: 'name', direction: 'asc' },
  ],
  'Semester Desc': [
    { key: 'semester', direction: 'desc' },
    { key: 'name', direction: 'asc' },
  ],
  'Title A-Z': [{ key: 'name', direction: 'asc' }],
}

export const sortSubjects = <T extends SortableSubject>(
  subjects: Array<T>,
  sort: SubjectSortOption
) => sortArray(subjects, SORT_RULES[sort])

/** The sort control every subject list that offers one shares. */
export const useSubjectSort = () => {
  const [sort, setSort] = useState<SubjectSortOption>('Semester')
  return { sort, setSort }
}
