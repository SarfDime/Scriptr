'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { useState } from 'react'
import { SubjectFilters } from '@/components/academics/subject/SubjectFilters'
import { SubjectsSidebar } from '@/components/academics/subject/SubjectsSidebar'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Select } from '@/components/ui/select/Select'
import { useSubjectFilters } from '@/hooks/useSubjectFilters'
import { cn } from '@/lib/common-utils'
import type { ProfileSubjectsSidebarProps } from '@/types/components/ProfilePage.types'
import type { SelectOptionType } from '@/types/components/Select.types'

type SubjectView = 'completed' | 'currently_taking'

const ALL = 'all'

/**
 * The profile's subjects section: a toggle (in the header) between completed
 * and currently-taking subjects, a study filter, and the shared year/electives
 * filters. Every option comes from the subjects in the showing list, so the
 * controls only offer what can match, and switching the list resets the study
 * filter.
 */
export function ProfileSubjectsSidebar({
  completed,
  currentlyTaking,
  title,
  studyTip,
}: ProfileSubjectsSidebarProps) {
  const strings = UI_STRINGS.profile.subjects
  const [view, setView] = useState<SubjectView>('currently_taking')
  const [studyId, setStudyId] = useState<string>(ALL)

  const subjects = view === 'completed' ? completed : currentlyTaking

  const studyOptions: Array<SelectOptionType<string>> = [
    ...new Map(
      subjects.map((subject) => [subject.study._id, subject.study.name])
    ),
  ].map(([id, name]) => ({ id: `study-${id}`, label: name, value: id }))
  // One study has nothing to choose: its own option is selected and locked.
  const onlyStudy = studyOptions.length === 1 ? studyOptions[0] : undefined
  const studyFilterLocked = onlyStudy !== undefined
  let activeStudyId = ALL
  if (onlyStudy) activeStudyId = onlyStudy.value
  else if (studyOptions.some((option) => option.value === studyId)) {
    activeStudyId = studyId
  }
  const studySelectOptions = onlyStudy
    ? studyOptions
    : [{ id: ALL, label: strings.allStudies, value: ALL }, ...studyOptions]

  const studyFiltered = subjects.filter(
    (subject) => activeStudyId === ALL || subject.study._id === activeStudyId
  )

  const {
    year,
    setYear,
    years,
    includeElectives,
    setIncludeElectives,
    visibleSubjects,
  } = useSubjectFilters(studyFiltered)

  const selectView = (nextView: SubjectView) => {
    setView(nextView)
    setStudyId(ALL)
  }

  const views: Array<{ value: SubjectView; label: string }> = [
    { value: 'currently_taking', label: strings.currentlyTaking },
    { value: 'completed', label: strings.completed },
  ]
  const viewCopy =
    view === 'completed'
      ? { subtitle: strings.completedSubtitle, empty: strings.completedEmpty }
      : {
          subtitle: strings.currentlyTakingSubtitle,
          empty: strings.currentlyTakingEmpty,
        }

  return (
    <SubjectsSidebar
      subjects={visibleSubjects}
      title={title}
      studyTip={studyTip}
      subtitle={viewCopy.subtitle}
      emptyMessage={
        subjects.length > 0
          ? UI_STRINGS.subjects.noMatchingSubjects
          : viewCopy.empty
      }
      headerProps={{
        actions: (
          <Box
            role='group'
            aria-label={strings.statusGroupLabel}
            className='ui-cluster gap-1'
          >
            {views.map(({ value, label }) => (
              <Button
                key={value}
                aria-pressed={view === value}
                onClick={() => selectView(value)}
                className={cn(
                  'button button-sm',
                  view === value ? 'solid' : 'subtle'
                )}
              >
                {label}
              </Button>
            ))}
          </Box>
        ),
      }}
      toolbar={
        subjects.length > 0 && (
          <Box className='ui-stack gap-2'>
            <Select
              key={`study:${view}:${studyOptions.length}`}
              defaultOption={studySelectOptions.find(
                (option) => option.value === activeStudyId
              )}
              disabled={studyFilterLocked}
              options={studySelectOptions}
              setSelectedValue={(value) => setStudyId(value || ALL)}
              triggerProps={{
                'aria-label': strings.studyFilterLabel,
                disabled: studyFilterLocked,
              }}
              className='w-auto max-w-full grow'
            />
            {/* `Select` keeps its own pick, so the filters remount when the
                list they read changes (another view or study selection). */}
            <SubjectFilters
              key={`filters:${view}:${years.join(',')}`}
              year={year}
              years={years}
              includeElectives={includeElectives}
              onYearChange={setYear}
              onIncludeElectivesChange={setIncludeElectives}
              className='grow'
            />
          </Box>
        )
      }
    />
  )
}
