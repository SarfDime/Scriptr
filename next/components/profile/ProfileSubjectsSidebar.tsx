'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { useState } from 'react'
import { SubjectsSidebar } from '@/components/academics/subject/SubjectsSidebar'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Select } from '@/components/ui/select/Select'
import { cn } from '@/lib/common-utils'
import type { ProfileSubjectsSidebarProps } from '@/types/components/ProfilePage.types'
import type { SelectOptionType } from '@/types/components/Select.types'

type SubjectView = 'completed' | 'currently_taking'

const ALL = 'all'

/**
 * What a filter select offers. With several values it gets an "all" option
 * and keeps the user's pick (falling back to "all" if that value is gone,
 * e.g. after the data refreshed). With a single value there is nothing to
 * choose, so that value is picked and the select is locked.
 */
const buildFilter = (
  allLabel: string,
  values: Array<SelectOptionType<string>>,
  selected: string
) => {
  const [only] = values
  if (values.length === 1 && only) {
    return { options: values, active: only.value, isLocked: true }
  }

  return {
    options: [{ id: ALL, label: allLabel, value: ALL }, ...values],
    active: values.some((option) => option.value === selected) ? selected : ALL,
    isLocked: false,
  }
}

/**
 * The profile's subjects section: a toggle (in the header) between completed
 * and currently-taking subjects, plus two independent filters over whichever
 * list is showing — by study and by year. The filter options come from the
 * subjects in the showing list, so they only offer what can match, and
 * switching the list resets both filters.
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
  const [year, setYear] = useState<string>(ALL)

  const subjects = view === 'completed' ? completed : currentlyTaking

  const studyFilter = buildFilter(
    strings.allStudies,
    [
      ...new Map(
        subjects.map((subject) => [subject.study._id, subject.study.name])
      ),
    ].map(([id, name]) => ({ id: `study-${id}`, label: name, value: id })),
    studyId
  )
  const yearFilter = buildFilter(
    strings.allYears,
    [...new Set(subjects.map((subject) => subject.year))]
      .sort((a, b) => a - b)
      .map((value) => ({
        id: `year-${value}`,
        label: UI_STRINGS.general.year(value),
        value: String(value),
      })),
    year
  )

  const visibleSubjects = subjects.filter(
    (subject) =>
      (studyFilter.active === ALL ||
        subject.study._id === studyFilter.active) &&
      (yearFilter.active === ALL || String(subject.year) === yearFilter.active)
  )

  const selectView = (nextView: SubjectView) => {
    setView(nextView)
    setStudyId(ALL)
    setYear(ALL)
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

  // Select keeps its own selected option, so it is remounted (a new `key`)
  // whenever the list it filters changes, to pick up the reset value.
  const selectKey = `${view}:${studyFilter.options.length}:${yearFilter.options.length}`

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
          <Box className='ui-cluster gap-2'>
            <Select
              key={`study:${selectKey}`}
              defaultOption={studyFilter.options.find(
                (option) => option.value === studyFilter.active
              )}
              disabled={studyFilter.isLocked}
              options={studyFilter.options}
              setSelectedValue={(value) => setStudyId(value || ALL)}
              triggerProps={{
                'aria-label': strings.studyFilterLabel,
                disabled: studyFilter.isLocked,
              }}
              className='w-auto max-w-full grow'
            />
            <Select
              key={`year:${selectKey}`}
              defaultOption={yearFilter.options.find(
                (option) => option.value === yearFilter.active
              )}
              disabled={yearFilter.isLocked}
              options={yearFilter.options}
              setSelectedValue={(value) => setYear(value || ALL)}
              triggerProps={{
                'aria-label': strings.yearFilterLabel,
                disabled: yearFilter.isLocked,
              }}
              className='w-auto max-w-full grow'
            />
          </Box>
        )
      }
    />
  )
}
