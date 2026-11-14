'use client'

import Calendar from '@sanity/icons/Calendar'
import CheckmarkCircle from '@sanity/icons/CheckmarkCircle'
import Circle from '@sanity/icons/Circle'
import Sort from '@sanity/icons/Sort'
import User from '@sanity/icons/User'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Select } from '@/components/ui/select/Select'
import type { SubjectSortOption } from '@/hooks/useSubjectExplorer'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import { useUIStrings } from '@/providers/locale/use-strings'
import type { SelectOptionType } from '@/types/components/Select.types'

export type SubjectSortFilter = {
  value: SubjectSortOption
  onChange: (sort: SubjectSortOption) => void
}

export type SubjectFiltersProps = {
  /** Always one of `years` — there is no "all years" option. */
  year: number
  years: Array<number>
  includeElectives: boolean
  onYearChange: (year: number) => void
  onIncludeElectivesChange: (include: boolean) => void
  /** Explorer lists sort; the sidebars deliberately do not. */
  sort?: SubjectSortFilter
  className?: string
}

const TRIGGER_CLASS = cn('ghost min-w-36 border-grey-300')

/**
 * The year/electives controls every subject list shares. Pair it with
 * `useSubjectFilters`, which owns the state and the year default.
 */
export const SubjectFilters = ({
  year,
  years,
  includeElectives,
  onYearChange,
  onIncludeElectivesChange,
  sort,
  className,
}: SubjectFiltersProps) => {
  const ui = useUIStrings()
  const iconClass = 'rounded-md'

  const yearOptions: Array<SelectOptionType<string>> = years.map((value) => ({
    id: `year-${value}`,
    label: ui.general.year(value),
    value: String(value),
    icon: (
      <Calendar
        className={cn(getColorPalette({ value, type: 'year' }), iconClass)}
      />
    ),
  }))

  const sortOptions: Array<SelectOptionType<SubjectSortOption>> = [
    {
      id: 'sort-semester',
      label: ui.subjects.filters.sortBySemester,
      value: 'Semester',
      icon: <Calendar className={iconClass} />,
    },
    {
      id: 'sort-semester-desc',
      label: ui.subjects.filters.sortBySemesterDesc,
      value: 'Semester Desc',
      icon: <Calendar className={iconClass} />,
    },
    {
      id: 'sort-name',
      label: ui.subjects.filters.sortBySubject,
      value: 'Subject A-Z',
      icon: <Sort className={iconClass} />,
    },
    {
      id: 'sort-professor',
      label: ui.subjects.filters.sortByProfessor,
      value: 'Professor A-Z',
      icon: <User className={iconClass} />,
    },
  ]

  const currentYearOption =
    yearOptions.find((option) => option.value === String(year)) ??
    yearOptions[0]

  return (
    <Box className={cn('flex flex-wrap gap-2 grow xxl:grow-0', className)}>
      {yearOptions.length > 0 && (
        <Select
          className='w-auto grow'
          defaultOption={currentYearOption}
          options={yearOptions}
          icon={
            <Calendar
              className={cn(
                getColorPalette({ value: year, type: 'year' }),
                iconClass
              )}
            />
          }
          setSelectedValue={(value) => value && onYearChange(Number(value))}
          triggerProps={{
            'aria-label': ui.subjects.filters.filterByYear,
            className: TRIGGER_CLASS,
          }}
        />
      )}

      {sort && (
        <Select<SubjectSortOption>
          className='w-auto grow'
          defaultOption={
            sortOptions.find((option) => option.value === sort.value) ??
            sortOptions[0]
          }
          options={sortOptions}
          setSelectedValue={(value) => value && sort.onChange(value)}
          triggerProps={{
            'aria-label': ui.subjects.filters.sortSubjects,
            className: TRIGGER_CLASS,
          }}
          icon={
            sort.value === 'Professor A-Z' ? (
              <User className={iconClass} />
              // biome-ignore lint/style/noNestedTernary: <Simple>
            ) : sort.value === 'Subject A-Z' ? (
              <Sort className={iconClass} />
            ) : (
              <Calendar className={iconClass} />
            )
          }
        />
      )}

      <Button
        aria-pressed={includeElectives}
        onClick={() => onIncludeElectivesChange(!includeElectives)}
        isActive={includeElectives}
        className={cn(
          'button button-sm w-fit min-h-0 ui-cluster gap-1 justify-center subtle'
        )}
      >
        {includeElectives ? <CheckmarkCircle /> : <Circle />}
        {ui.subjects.filters.electives}
      </Button>
    </Box>
  )
}
