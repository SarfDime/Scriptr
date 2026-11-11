'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { SubjectCard } from '@/components/academics/subject/SubjectCard'
import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SearchBar } from '@/components/typography/SearchBar'
import { Text } from '@/components/typography/Text'
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
    years,
    includeElectives,
    setIncludeElectives,
    sort,
    setSort,
    visibleSubjects,
  } = useSubjectExplorer(subjects)

  return (
    /* `#subjects`: a link from the study's script feed lands on the list
       itself rather than the top of the study page. */
    <Card id='subjects' className='ui-stack ui-above'>
      <SectionHeader
        title={UI_STRINGS.subjects.title}
        count={visibleSubjects.length}
      />

      <Box className='ui-cluster items-start justify-between gap-3'>
        <SearchBar
          label={UI_STRINGS.subjects.searchLabel}
          inputVal={query}
          inputOnChange={(event) => setQuery(event.target.value)}
          inputProps={{
            placeholder: UI_STRINGS.subjects.searchPlaceholder,
          }}
          className='min-w-[50%]'
        />

        <SubjectFilters
          year={year}
          years={years}
          includeElectives={includeElectives}
          onYearChange={setYear}
          onIncludeElectivesChange={setIncludeElectives}
          sort={{ value: sort, onChange: setSort }}
        />
      </Box>

      {visibleSubjects.length > 0 ? (
        <Box className='ui-grid-split'>
          {visibleSubjects.map((subject) => (
            <SubjectCard key={subject._id} {...subject} />
          ))}
        </Box>
      ) : (
        <Text className='ui-caption'>
          {subjects.length === 0
            ? UI_STRINGS.subjects.noSubjects
            : UI_STRINGS.subjects.noMatchingSubjects}
        </Text>
      )}
    </Card>
  )
}
