import Calendar from '@sanity/icons/Calendar'
import Sort from '@sanity/icons/Sort'
import User from '@sanity/icons/User'
import { UI_STRINGS } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Select } from '@/components/ui/select/Select'
import type { SubjectSortOption } from '@/hooks/useSubjectExplorer'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
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

/**
 * The selects' trigger and the electives toggle share one box, so the row's
 * controls line up. `Select` gives its trigger its own type scale (16px, with a
 * 16px line-height below `md`), so a plain `button-sm` toggle came out shorter
 * than the selects beside it.
 */
const CONTROL_BOX_CLASS =
  'button text-base leading-4 md:leading-6 rounded-lg border px-3 py-2'

const TRIGGER_CLASS = cn(CONTROL_BOX_CLASS, 'ghost min-w-36 border-grey-300')

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
  const iconClass = 'rounded-md'

  const yearOptions: Array<SelectOptionType<string>> = years.map((value) => ({
    id: `year-${value}`,
    label: UI_STRINGS.general.year(value),
    value: String(value),
    icon: (
      <Calendar
        className={cn(getColorPalette({ value, type: 'year' }), iconClass)}
      />
    ),
  }))

  const sortOptions: Array<SelectOptionType<SubjectSortOption>> = [
    {
      id: 'sort-year',
      label: UI_STRINGS.subjects.filters.sortByYear,
      value: 'Year',
      icon: <Calendar className={iconClass} />,
    },
    {
      id: 'sort-name',
      label: UI_STRINGS.subjects.filters.sortBySubject,
      value: 'Subject A-Z',
      icon: <Sort className={iconClass} />,
    },
    {
      id: 'sort-professor',
      label: UI_STRINGS.subjects.filters.sortByProfessor,
      value: 'Professor A-Z',
      icon: <User className={iconClass} />,
    },
  ]

  const currentYearOption =
    yearOptions.find((option) => option.value === String(year)) ??
    yearOptions[0]

  return (
    <Box className={cn('ui-cluster gap-2 grow xxl:grow-0', className)}>
      {yearOptions.length > 0 && (
        <Select
          className='w-auto grow bg-background-200'
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
            'aria-label': UI_STRINGS.subjects.filters.filterByYear,
            className: TRIGGER_CLASS,
          }}
        />
      )}

      <Button
        aria-pressed={includeElectives}
        onClick={() => onIncludeElectivesChange(!includeElectives)}
        className={cn(
          CONTROL_BOX_CLASS,
          'border-transparent',
          includeElectives ? 'solid' : 'subtle'
        )}
      >
        {UI_STRINGS.subjects.filters.electives}
      </Button>

      {sort && (
        <Select<SubjectSortOption>
          className='w-auto grow bg-background-200'
          defaultOption={
            sortOptions.find((option) => option.value === sort.value) ??
            sortOptions[0]
          }
          options={sortOptions}
          setSelectedValue={(value) => value && sort.onChange(value)}
          triggerProps={{
            'aria-label': UI_STRINGS.subjects.filters.sortSubjects,
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
    </Box>
  )
}
