import Calendar from '@sanity/icons/Calendar'
import Sort from '@sanity/icons/Sort'
import User from '@sanity/icons/User'
import { UI_STRINGS } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { Select } from '@/components/ui/select/Select'
import type { SubjectSortOption } from '@/hooks/useSubjectExplorer'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import type { SelectOptionType } from '@/types/components/Select.types'

export type StudySubjectFiltersProps = {
  year: number | 'all'
  years: Array<number>
  sort: SubjectSortOption
  onYearChange: (year: number | 'all') => void
  onSortChange: (sort: SubjectSortOption) => void
}

export const SubjectFilters = ({
  year,
  years,
  sort,
  onYearChange,
  onSortChange,
}: StudySubjectFiltersProps) => {
  const iconClass = 'rounded-md'

  const yearOptions: Array<SelectOptionType<string>> = [
    {
      id: 'all-years',
      label: UI_STRINGS.subjects.filters.allYears,
      value: 'all',
      icon: <Calendar className={iconClass} />,
    },
    ...years.map((y) => ({
      id: `year-${y}`,
      label: UI_STRINGS.general.year(y),
      value: String(y),
      icon: (
        <Calendar
          className={cn(getColorPalette({ value: y, type: 'year' }), iconClass)}
        />
      ),
    })),
  ]

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

  const currentSortOption =
    sortOptions.find((option) => option.value === sort) ?? sortOptions[0]

  return (
    <Box className='ui-cluster gap-2 grow xxl:grow-0'>
      <Select
        className='w-auto grow bg-background-200'
        defaultOption={currentYearOption}
        options={yearOptions}
        icon={
          <Calendar
            className={cn(
              getColorPalette({
                value: year === 'all' ? 0 : year,
                type: 'year',
              }),
              iconClass
            )}
          />
        }
        setSelectedValue={(val) =>
          onYearChange(val === 'all' || !val ? 'all' : Number(val))
        }
        triggerProps={{
          'aria-label': UI_STRINGS.subjects.filters.filterByYear,
          className:
            'button button-sm ghost min-w-36 rounded-lg border border-grey-300 px-3 py-2',
        }}
      />

      <Select<SubjectSortOption>
        className='w-auto grow bg-background-200'
        defaultOption={currentSortOption}
        options={sortOptions}
        setSelectedValue={(val) => val && onSortChange(val)}
        triggerProps={{
          'aria-label': UI_STRINGS.subjects.filters.sortSubjects,
          className:
            'button button-sm ghost min-w-36 rounded-lg border border-grey-300 px-3 py-2',
        }}
        icon={
          sort === 'Professor A-Z' ? (
            <User className={iconClass} />
            // biome-ignore lint/style/noNestedTernary: <Simple>
          ) : sort === 'Subject A-Z' ? (
            <Sort className={iconClass} />
          ) : (
            <Calendar className={iconClass} />
          )
        }
      />
    </Box>
  )
}
