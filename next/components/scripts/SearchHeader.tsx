import Search from '@sanity/icons/Search'
import { cn } from '@/lib/common-utils'
import { Box } from '../common/Box'
import { Text } from '../typography/Text'
import { Title } from '../typography/Title'

interface SearchHeaderProps {
  greeting: string
  query: string
  onQueryChange: (value: string) => void
}

export const SearchHeader = ({
  greeting,
  query,
  onQueryChange,
}: SearchHeaderProps) => {
  return (
    <Box
      as='section'
      className={cn(
        'ui-stack gap-6 border-b border-grey-300 pb-10',
        'lg:flex-row lg:items-end lg:justify-between'
      )}
    >
      <Box className='ui-stack gap-3'>
        <Text className='text-sm text-brand'>{greeting}</Text>
        <Title
          as='h1'
          className='max-w-2xl text-4xl font-medium tracking-[-0.055em] text-fg-700 md:text-5xl'
        >
          Make studying feel a little lighter.
        </Title>
        <Text className='max-w-xl text-base leading-7 text-fg-400'>
          Find the notes, scripts, and shared knowledge you need to move through
          this week with confidence.
        </Text>
      </Box>

      <Box className='w-full max-w-md'>
        <label className='sr-only' htmlFor='script-search'>
          Search scripts
        </label>
        <Box
          className={cn(
            'flex items-center gap-3 rounded-xl border border-grey-300 bg-background-200',
            'px-4 py-3.5 shadow-mdx focus-within:border-brand-300'
          )}
        >
          <Search className='text-fg-400' />
          <input
            id='script-search'
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder='Search scripts, subjects, professors...'
            className='min-w-0 flex-1 bg-transparent text-sm text-fg-700 outline-none placeholder:text-fg-400'
          />
          <kbd className='hidden rounded border border-grey-300 px-1.5 py-0.5 font-mono text-[10px] text-fg-400 sm:block'>
            ⌘ K
          </kbd>
        </Box>
      </Box>
    </Box>
  )
}
