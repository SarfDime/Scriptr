'use client'

import { useSubjectFilters } from '@/hooks/useSubjectFilters'
import { sortSubjects, useSubjectSort } from '@/hooks/useSubjectSort'
import { useUIStrings } from '@/providers/locale/use-strings'
import type { SubjectSidebarItem } from '@/types/academics/subject.types'
import { SubjectElectivesToggle, SubjectFilters } from './SubjectFilters'
import { SubjectsSidebar } from './SubjectsSidebar'

type StudySubjectsPanelProps = {
  subjects: Array<SubjectSidebarItem>
}

/**
 * The scripts page's subjects: the study's subjects one year at a time with
 * the shared year/sort controls, and the electives toggle in the header so the
 * filter row stays a filter row.
 */
export const StudySubjectsPanel = ({ subjects }: StudySubjectsPanelProps) => {
  const ui = useUIStrings()
  const {
    year,
    setYear,
    years,
    includeElectives,
    setIncludeElectives,
    visibleSubjects,
  } = useSubjectFilters(subjects)
  const { sort, setSort } = useSubjectSort()
  const hasSubjects = subjects.length > 0

  return (
    <SubjectsSidebar
      subjects={sortSubjects(visibleSubjects, sort)}
      emptyMessage={hasSubjects ? ui.subjects.noMatchingSubjects : undefined}
      headerProps={{
        actions: hasSubjects ? (
          <SubjectElectivesToggle
            includeElectives={includeElectives}
            onChange={setIncludeElectives}
          />
        ) : undefined,
      }}
      toolbar={
        hasSubjects && (
          <SubjectFilters
            year={year}
            years={years}
            includeElectives={includeElectives}
            onYearChange={setYear}
            onIncludeElectivesChange={setIncludeElectives}
            sort={{ value: sort, onChange: setSort }}
            showElectives={false}
          />
        )
      }
    />
  )
}
