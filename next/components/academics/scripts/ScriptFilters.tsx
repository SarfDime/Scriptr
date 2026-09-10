import Documents from '@sanity/icons/Documents'
import Refresh from '@sanity/icons/Refresh'
import Sort from '@sanity/icons/Sort'
import { UI_STRINGS } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { Select } from '@/components/ui/select/Select'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import type {
  ScriptFiltersProps,
  ScriptSortOption,
} from '@/types/components/Scripts.types'
import type { SelectOptionType } from '@/types/components/Select.types'

/** Filters for scripts by subject and sort order. */
export const ScriptFilters = ({
  subject,
  subjects,
  sort,
  onSubjectChange,
  onSortChange,
}: ScriptFiltersProps) => {
  const iconClass = 'rounded-md w-6 h-6'
  const subjectOptions: Array<SelectOptionType<string>> = [
    {
      id: 'all-subjects',
      label: UI_STRINGS.scripts.filters.allSubjects,
      value: '',
      icon: <Documents className={cn(`cp-sky`, iconClass)} />,
    },
    ...subjects.map((item) => ({
      id: `subject-${item}`,
      label: item,
      value: item,
      icon: (
        <Documents
          className={cn(
            getColorPalette({ value: item, type: 'seed' }),
            iconClass
          )}
        />
      ),
    })),
  ]
  const sortOptions: Array<SelectOptionType<ScriptSortOption>> = [
    {
      id: 'recently-updated',
      label: UI_STRINGS.scripts.filters.recentlyUpdated,
      value: 'Recently updated',
      icon: <Refresh className={iconClass} />,
    },
    {
      id: 'title-a-z',
      label: UI_STRINGS.scripts.filters.titleAZ,
      value: 'Title A-Z',
      icon: <Sort className={iconClass} />,
    },
  ]

  return (
    <Box className='ui-cluster gap-2'>
      <Select
        className='w-auto h-full bg-background-200'
        defaultOption={
          subjectOptions.find((option) => option.value === subject) ??
          subjectOptions[0]
        }
        options={subjectOptions}
        icon={
          <Documents
            className={cn(
              getColorPalette({
                value:
                  subjectOptions.find((option) => option.value === subject)
                    ?.value || '',
                type: 'seed',
              }),
              iconClass
            )}
          />
        }
        setSelectedValue={(value) => onSubjectChange(value || '')}
        triggerProps={{
          'aria-label': UI_STRINGS.scripts.filters.subjectLabel,
          className:
            'button ghost min-w-36 rounded-lg border border-grey-300 px-3 py-2 ui-caption',
        }}
      />
      <Select<ScriptSortOption>
        className='w-auto h-full bg-background-200'
        defaultOption={
          sortOptions.find((option) => option.value === sort) ?? sortOptions[0]
        }
        options={sortOptions}
        setSelectedValue={onSortChange}
        triggerProps={{
          'aria-label': UI_STRINGS.scripts.filters.sortLabel,
          className:
            'button ghost min-w-36 rounded-lg border border-grey-300 px-3 py-2 ui-caption',
        }}
        icon={
          sort === 'Title A-Z' ? (
            <Sort className={iconClass} />
          ) : (
            <Refresh className={iconClass} />
          )
        }
      />
    </Box>
  )
}
