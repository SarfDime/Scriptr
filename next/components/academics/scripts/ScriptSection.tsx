'use client'

import ChevronDownIcon from '@sanity/icons/ChevronDown'
import { UI_STRINGS } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { useScriptExplorer } from '@/hooks/useScriptExplorer'
import { cn } from '@/lib/common-utils'
import type { ScriptsSectionProps } from '@/types/components/Scripts.types'
import { SearchBar } from '../../typography/SearchBar'
import { CreateScriptModal } from './CreateScriptModal'
import { ScriptCard } from './ScriptCard'
import { ScriptFilters } from './ScriptFilters'

const VISIBLE_LIMIT = 5

/** A component that renders a section displaying a list of scripts with search and filter functionality. */
export const ScriptsSection = ({
  scripts,
  title = UI_STRINGS.scripts.sectionTitle,
  subtitle = UI_STRINGS.scripts.sectionSubtitle,
  className,
  parentSubject,
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
    <Box
      as='section'
      className={cn('ui-stack gap-4 ui-above p-4', className)}
      {...rest}
    >
      <SectionHeader
        title={title}
        subtitle={subtitle}
        count={visibleScripts.length}
      />

      <Box className='ui-cluster items-start justify-between gap-3 p-[0.1px]'>
        <SearchBar
          inputVal={query}
          inputOnChange={(event) => setQuery(event.target.value)}
          className='min-w-[50%]'
        />

        <ScriptFilters
          subject={subject}
          subjects={subjectOptions}
          sort={sort}
          onSubjectChange={setSubject}
          onSortChange={setSort}
        />
        {parentSubject && <CreateScriptModal subject={parentSubject} />}
      </Box>

      {shownScripts.length > 0 ? (
        <Box className='grid-auto-fit gap-3 [--grid-min:22rem]'>
          {shownScripts.map((script) => (
            <ScriptCard
              key={script.id}
              script={script}
              className='ui-above-inside'
            />
          ))}
        </Box>
      ) : (
        <Text className='ui-above-inside ui-subtitle rounded-xl border border-dashed border-grey-300 px-6 py-14 text-center'>
          {UI_STRINGS.scripts.emptyState}
        </Text>
      )}

      {hasMore && (
        <Button className='button subtle w-full gap-2 py-3 ui-body'>
          <Text>{UI_STRINGS.scripts.browseAll}</Text> <ChevronDownIcon />
        </Button>
      )}
    </Box>
  )
}
