'use client'

import ChevronDownIcon from '@sanity/icons/ChevronDown'
import SearchIcon from '@sanity/icons/Search'
import { Box, type BoxProps } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Badge } from '@/components/ui/Badge'
import { useScriptExplorer } from '@/hooks/useScriptExplorer'
import { cn } from '@/lib/common-utils'
import type { ScriptDetail } from '@/types/components/Scripts.types'
import { ScriptCard } from './ScriptCard'
import { ScriptFilters } from './ScriptFilters'

const VISIBLE_LIMIT = 5

type ScriptsSectionProps = {
  scripts: Array<ScriptDetail>
} & Omit<BoxProps, 'children'>

export const ScriptsSection = ({
  scripts,
  className,
  ...rest
}: ScriptsSectionProps) => {
  const {
    query,
    setQuery,
    subject,
    setSubject,
    sort,
    setSort,
    subjectOptions,
    visibleScripts,
  } = useScriptExplorer(scripts)

  const shownScripts = visibleScripts.slice(0, VISIBLE_LIMIT)
  const hasMore = visibleScripts.length > VISIBLE_LIMIT

  return (
    <Box as='section' className={cn('ui-stack gap-4', className)} {...rest}>
      <Box className='ui-cluster items-center gap-2'>
        {/* TODO: Text in this file should come from sanity or should be added to strings shared file */}
        <Title as='h2' className='ui-title font-bold'>
          Subject Scripts
        </Title>
        <Badge className='cp-brand'>{visibleScripts.length}</Badge>
      </Box>
      <Text className='ui-caption text-grey-500'>
        Notes and study material shared by this subject community.
      </Text>

      <Box className='ui-cluster items-start justify-between gap-3'>
        {/** biome-ignore lint/a11y/noLabelWithoutControl: <TODO: Use a proper accessible search input using fieldWrapper and maybe create a solid search bar component> */}
        <label className='relative min-w-55 flex-1'>
          <span className='sr-only'>Search scripts</span>
          <SearchIcon className='pointer-events-none absolute left-3 top-2.5 text-fg-400' />
          <InputWrapper
            inputVal={query}
            inputOnChange={(event) => setQuery(event.target.value)}
            inputProps={{
              placeholder: 'Search scripts, authors, tags',
              className:
                'ui-body w-full rounded-lg border border-grey-300 bg-background-200 py-2 pl-9 pr-3 outline-none placeholder:text-fg-400 focus:border-brand-300',
            }}
          />
        </label>

        <ScriptFilters
          subject={subject}
          subjects={subjectOptions}
          sort={sort}
          onSubjectChange={setSubject}
          onSortChange={setSort}
        />
      </Box>

      {shownScripts.length > 0 ? (
        <Box className='ui-stack gap-3'>
          {shownScripts.map((script) => (
            <ScriptCard key={script.id} script={script} />
          ))}
        </Box>
      ) : (
        <Text className='ui-subtitle rounded-xl border border-dashed border-grey-300 px-6 py-14 text-center text-grey-500'>
          No scripts match these filters.
        </Text>
      )}

      {hasMore && (
        <Button className='button subtle w-full gap-2 py-3 ui-body'>
          <Text>Browse all scripts</Text> <ChevronDownIcon />
        </Button>
      )}
    </Box>
  )
}
