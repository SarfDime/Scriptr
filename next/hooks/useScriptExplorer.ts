'use client'

import { filterByWeight } from '@shared/utils/array-utils/filter'
import { fuzzySearch } from '@shared/utils/array-utils/search'
import { type SortRule, sortArray } from '@shared/utils/array-utils/sort'
import { useMemo, useState } from 'react'
import type {
  ScriptDetail,
  ScriptSortOption,
} from '@/types/components/Scripts.types'

const SORT_RULES: Record<ScriptSortOption, Array<SortRule<ScriptDetail>>> = {
  'Recently updated': [{ key: 'updatedAt', direction: 'desc' }],
  'Title A-Z': [{ key: 'title', direction: 'asc' }],
}

export const useScriptExplorer = (scripts: Array<ScriptDetail>) => {
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('')
  const [sort, setSort] = useState<ScriptSortOption>('Recently updated')

  const subjectOptions = useMemo(
    () => Array.from(new Set(scripts.map((script) => script.subject))),
    [scripts]
  )

  const visibleScripts = useMemo(() => {
    const bySubject = subject
      ? filterByWeight(
          scripts,
          [
            {
              key: 'subject',
              predicate: (value) => value === subject,
              weight: 1,
            },
          ],
          1
        )
      : scripts

    const matched = fuzzySearch(bySubject, query, [
      { key: 'title', weight: 3 },
      { key: 'author', weight: 1.5 },
      { key: 'tag', weight: 1 },
    ])

    return sortArray(matched, SORT_RULES[sort])
  }, [scripts, subject, query, sort])

  return {
    query,
    setQuery,
    subject,
    setSubject,
    sort,
    setSort,
    subjectOptions,
    visibleScripts,
  }
}
