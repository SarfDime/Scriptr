'use client'

import { useSubjectFilters } from '@/hooks/useSubjectFilters'
import { useUIStrings } from '@/providers/locale/use-strings'
import type { SubjectSidebarItem } from '@/types/academics/subject.types'
import { SubjectFilters } from './SubjectFilters'
import { SubjectsSidebar } from './SubjectsSidebar'

type StudySubjectsPanelProps = {
  subjects: Array<SubjectSidebarItem>
}

/**
 * The scripts page's subjects: the study's subjects one year at a time, with
 * the same year/electives filters every subject list uses. No sort — the
 * sidebar is short and already ordered by the read that fills it, and the list
 * scrolls past four cards.
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

  return (
    <SubjectsSidebar
      subjects={visibleSubjects}
      emptyMessage={
        subjects.length > 0 ? ui.subjects.noMatchingSubjects : undefined
      }
      toolbar={
        subjects.length > 0 && (
          <SubjectFilters
            year={year}
            years={years}
            includeElectives={includeElectives}
            onYearChange={setYear}
            onIncludeElectivesChange={setIncludeElectives}
          />
        )
      }
    />
  )
}
