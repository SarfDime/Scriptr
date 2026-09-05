import Search from '@sanity/icons/Search'
import { UI_STRINGS } from '@shared/config/strings'
import { cn } from '@/lib/common-utils'
import type { SearchHeaderProps } from '@/types/components/Scripts.types'
import { Box } from '../common/Box'
import { InputWrapper } from '../typography/InputWrapper'
import { Text } from '../typography/Text'
import { Title } from '../typography/Title'

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
        <Text className='ui-title text-brand'>{greeting}</Text>
        <Title as='h1' className='ui-display max-w-2xl'>
          Make studying feel a little lighter.
        </Title>
        <Text className='ui-subtitle max-w-xl leading-7'>
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
          <InputWrapper
            inputVal={query}
            inputOnChange={(event) => onQueryChange(event.target.value)}
            inputProps={{
              id: 'script-search',
              placeholder: UI_STRINGS.scripts.searchPlaceholder,
              className:
                'ui-body min-w-0 flex-1 bg-transparent text-fg-700 outline-none placeholder:text-fg-400',
            }}
          />
          <kbd className='hidden rounded border border-grey-300 px-1.5 py-0.5 font-mono text-[10px] text-fg-400 sm:block'>
            ⌘ K
          </kbd>
        </Box>
      </Box>
    </Box>
  )
}
