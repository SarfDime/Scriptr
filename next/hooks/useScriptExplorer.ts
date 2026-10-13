'use client'

import { filterByWeight } from '@shared/utils/array-utils/filter'
import { fuzzySearch } from '@shared/utils/array-utils/search'
import { type SortRule, sortArray } from '@shared/utils/array-utils/sort'
import { portableTextToPlainText } from '@shared/utils/portable-text.utils'
import { useState } from 'react'
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

  const subjectOptions = Array.from(
    new Set(scripts.map((script) => script.subject))
  )

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

  // Script titles are Portable Text arrays, not strings. Flatten them before
  // fuzzy matching so title searches compare against the visible title text.
  const matchedIds = new Set(
    fuzzySearch(
      bySubject.map((script) => ({
        ...script,
        searchableTitle: portableTextToPlainText(script.title),
      })),
      query,
      [
        { key: 'searchableTitle', weight: 3 },
        { key: 'author', weight: 1.5 },
        { key: 'tag', weight: 1 },
      ]
    ).map((script) => script.id)
  )
  const matched = bySubject.filter((script) => matchedIds.has(script.id))

  const visibleScripts = sortArray(matched, SORT_RULES[sort])

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
