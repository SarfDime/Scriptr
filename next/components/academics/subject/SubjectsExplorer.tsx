'use client'

import { SubjectCard } from '@/components/academics/subject/SubjectCard'
import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SearchBar } from '@/components/typography/SearchBar'
import { Text } from '@/components/typography/Text'
import { useSubjectExplorer } from '@/hooks/useSubjectExplorer'
import { useUIStrings } from '@/providers/locale/use-strings'
import type { MinimalSubject } from '@/types/academics/subject.types'
import { SubjectFilters } from './SubjectFilters'

type SubjectsExplorerProps = {
  subjects: Array<MinimalSubject>
}

export const SubjectsExplorer = ({ subjects }: SubjectsExplorerProps) => {
  const ui = useUIStrings()
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
    <Box as='section' id='subjects' className='ui-stack ui-above'>
      <Box className='ui-cluster  items-start justify-between'>
        <SectionHeader
          title={ui.subjects.title}
          titleVariant='subHeading'
          count={visibleSubjects.length}
        />

        <SubjectFilters
          year={year}
          years={years}
          includeElectives={includeElectives}
          onYearChange={setYear}
          onIncludeElectivesChange={setIncludeElectives}
          sort={{ value: sort, onChange: setSort }}
        />
        <SearchBar
          label={ui.subjects.searchLabel}
          inputVal={query}
          inputOnChange={(event) => setQuery(event.target.value)}
          inputProps={{
            placeholder: ui.subjects.searchPlaceholder,
          }}
          className='min-w-[50%]'
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
            ? ui.subjects.noSubjects
            : ui.subjects.noMatchingSubjects}
        </Text>
      )}
    </Box>
  )
}
