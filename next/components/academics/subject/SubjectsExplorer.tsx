'use client'

import { SubjectCard } from '@/components/academics/subject/SubjectCard'
import { Box } from '@/components/common/Box'
import { SearchBar } from '@/components/typography/SearchBar'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { useSubjectExplorer } from '@/hooks/useSubjectExplorer'
import type { MinimalSubject } from '@/types/academics/subject.types'
import { SubjectFilters } from './SubjectFilters'

type SubjectsExplorerProps = {
  subjects: Array<MinimalSubject>
}

export const SubjectsExplorer = ({ subjects }: SubjectsExplorerProps) => {
  const {
    query,
    setQuery,
    year,
    setYear,
    sort,
    setSort,
    yearOptions,
    visibleSubjects,
  } = useSubjectExplorer(subjects)

  return (
    <Card className='p-0 border-0 ui-stack gap-4 bg-transparent'>
      <Box className='ui-cluster items-center gap-2'>
        <Title as='h2' className='ui-title font-bold'>
          Subjects
        </Title>
        <Badge className='cp-brand'>{visibleSubjects.length}</Badge>
      </Box>

      <Box className='ui-cluster items-start justify-between gap-3'>
        <SearchBar
          inputVal={query}
          inputOnChange={(event) => setQuery(event.target.value)}
          inputProps={{
            placeholder: 'Search subjects, codes, or professors',
          }}
          className='min-w-[50%]'
        />

        <SubjectFilters
          year={year}
          years={yearOptions}
          sort={sort}
          onYearChange={setYear}
          onSortChange={setSort}
        />
      </Box>

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
