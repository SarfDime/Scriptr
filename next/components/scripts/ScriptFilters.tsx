import ChevronDown from '@sanity/icons/ChevronDown'
import Menu from '@sanity/icons/Menu'
import { Box } from '../common/Box'

export type SortOption = 'Recently updated' | 'Title A-Z'

interface ScriptFiltersProps {
  subject: string
  subjects: Array<string>
  sort: SortOption
  onSubjectChange: (value: string) => void
  onSortChange: (value: SortOption) => void
}

export const ScriptFilters = ({
  subject,
  subjects,
  sort,
  onSubjectChange,
  onSortChange,
}: ScriptFiltersProps) => {
  return (
    <Box className='flex items-center gap-2'>
      <Box className='relative'>
        <Menu className='pointer-events-none absolute left-3 top-2.5 text-fg-400' />
        <select
          value={subject}
          onChange={(event) => onSubjectChange(event.target.value)}
          className='appearance-none rounded-lg border border-grey-300 bg-background-200 py-2 pl-9 pr-8 text-xs text-fg-400 outline-none focus:border-brand-300'
        >
          <option>All subjects</option>
          {subjects.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <ChevronDown className='pointer-events-none absolute right-2.5 top-2.5 text-fg-400' />
      </Box>
      <select
        value={sort}
        onChange={(event) => onSortChange(event.target.value as SortOption)}
        className='rounded-lg border border-grey-300 bg-background-200 px-3 py-2 text-xs text-fg-400 outline-none focus:border-brand-300'
      >
        <option>Recently updated</option>
        <option>Title A-Z</option>
      </select>
    </Box>
  )
}
