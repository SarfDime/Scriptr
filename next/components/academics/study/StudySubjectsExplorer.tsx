'use client'

import Search from '@sanity/icons/Search'
import { useMemo, useState } from 'react'
import { Box } from '@/components/common/Box'
import { SubjectCard } from '@/components/Subjects/SubjectCard'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import type { MinimalSubject } from '@/types/academics/subject.types'

type StudySubject = MinimalSubject
type SortOption = 'year' | 'name' | 'professor'

type StudySubjectsExplorerProps = {
  subjects: Array<MinimalSubject>
}

const getPrimaryProfessorName = (subject: StudySubject) =>
  subject.professors?.[0]?.name ?? ''

const sortSubjects = (subjects: Array<StudySubject>, sort: SortOption) =>
  [...subjects].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'professor') {
      return getPrimaryProfessorName(a).localeCompare(
        getPrimaryProfessorName(b)
      )
    }
    return a.year - b.year
  })

const matchesQuery = (subject: StudySubject, query: string) => {
  if (!query) return true
  const haystack = [
    subject.name,
    subject.code,
    getPrimaryProfessorName(subject),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(query.toLowerCase())
}

export const StudySubjectsExplorer = ({
  subjects,
}: StudySubjectsExplorerProps) => {
  // TODO: Use filters and sorts with the existing utils in shared
  const [year, setYear] = useState<number | 'all'>('all')
  const [sort, setSort] = useState<SortOption>('year')
  const [query, setQuery] = useState('')

  const years = useMemo(
    () =>
      Array.from(new Set(subjects.map((subject) => subject.year))).sort(
        (a, b) => a - b
      ),
    [subjects]
  )

  const visibleSubjects = useMemo(() => {
    const filtered = subjects.filter(
      (subject) =>
        (year === 'all' || subject.year === year) &&
        matchesQuery(subject, query)
    )
    return sortSubjects(filtered, sort)
  }, [subjects, year, sort, query])

  return (
    <Card className='p-6 ui-stack gap-4'>
      <Box className='ui-cluster justify-between items-center'>
        <Box className='ui-cluster gap-2 items-center'>
          <Title as='h2' className='ui-title font-bold'>
            Subjects
          </Title>
          <Badge className='cp-brand'>{visibleSubjects.length}</Badge>
        </Box>

        <Box className='ui-cluster gap-2'>
          <label>
            <span className='sr-only'>Filter by year</span>
            <select
              value={year}
              onChange={(event) =>
                setYear(
                  event.target.value === 'all'
                    ? 'all'
                    : Number(event.target.value)
                )
              }
              className='ui-caption rounded-lg border border-grey-200 bg-transparent px-2 py-1.5'
            >
              <option value='all'>All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className='sr-only'>Sort subjects</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className='ui-caption rounded-lg border border-grey-200 bg-transparent px-2 py-1.5'
            >
              <option value='year'>Sort by year</option>
              <option value='name'>Sort by subject</option>
              <option value='professor'>Sort by professor</option>
            </select>
          </label>
        </Box>
      </Box>

      <label className='relative block'>
        <span className='sr-only'>Search subjects</span>
        <Search className='pointer-events-none absolute left-2.5 top-2.5 text-fg-400' />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='Search subjects, codes, or professors'
          className='ui-body w-full rounded-lg border border-grey-200 bg-transparent py-2 pl-9 pr-3 focus:border-brand focus:outline-none'
        />
      </label>

      {visibleSubjects.length > 0 ? (
        <Box className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {visibleSubjects.map((subject) => (
            <SubjectCard key={subject._id} {...subject} />
          ))}
        </Box>
      ) : (
        <Text className='ui-caption text-grey-500'>
          No subjects match those filters.
        </Text>
      )}
    </Card>
  )
}
