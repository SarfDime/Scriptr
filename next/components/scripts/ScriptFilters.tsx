import Menu from '@sanity/icons/Menu'
import { UI_STRINGS } from '@shared/config/strings'
import type {
  ScriptFiltersProps,
  SortOption,
} from '@/types/components/Scripts.types'
import type { SelectOptionType } from '@/types/components/Select.types'
import { Box } from '../common/Box'
import { Select } from '../ui/select/Select'

export const ScriptFilters = ({
  subject,
  subjects,
  sort,
  onSubjectChange,
  onSortChange,
}: ScriptFiltersProps) => {
  const subjectOptions: Array<SelectOptionType<string>> = [
    {
      id: 'all-subjects',
      label: UI_STRINGS.scripts.filters.allSubjects,
      value: '',
    },
    ...subjects.map((item) => ({
      id: `subject-${item}`,
      label: item,
      value: item,
    })),
  ]
  const sortOptions: Array<SelectOptionType<SortOption>> = [
    {
      id: 'recently-updated',
      label: UI_STRINGS.scripts.filters.recentlyUpdated,
      value: 'Recently updated',
    },
    {
      id: 'title-a-z',
      label: UI_STRINGS.scripts.filters.titleAZ,
      value: 'Title A-Z',
    },
  ]

  return (
    <Box className='flex items-center gap-2'>
      <Select
        className='w-auto bg-background-200'
        defaultOption={
          subjectOptions.find((option) => option.value === subject) ??
          subjectOptions[0]
        }
        options={subjectOptions}
        icon={<Menu className='text-fg-400' />}
        setSelectedValue={(value) => onSubjectChange(value || '')}
        triggerProps={{
          'aria-label': UI_STRINGS.scripts.filters.subjectLabel,
          className:
            'button ghost min-w-36 rounded-lg border border-grey-300 px-3 py-2 ui-caption',
        }}
      />
      <Select<SortOption>
        className='w-auto bg-background-200'
        defaultOption={sortOptions.find((option) => option.value === sort)}
        options={sortOptions}
        setSelectedValue={onSortChange}
        triggerProps={{
          'aria-label': UI_STRINGS.scripts.filters.sortLabel,
          className:
            'button ghost min-w-36 rounded-lg border border-grey-300 px-3 py-2 ui-caption',
        }}
      />
    </Box>
  )
}
