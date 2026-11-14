'use client'

import ChevronDownIcon from '@sanity/icons/ChevronDown'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { useScriptExplorer } from '@/hooks/useScriptExplorer'
import { cn } from '@/lib/common-utils'
import { useUIStrings } from '@/providers/locale/use-strings'
import type { ScriptsSectionProps } from '@/types/components/Scripts.types'
import { SearchBar } from '../../typography/SearchBar'
import { CreateScriptModal } from './CreateScriptModal'
import { ScriptFilters } from './ScriptFilters'
import { ScriptList } from './ScriptList'

const VISIBLE_LIMIT = 5

/** A component that renders a section displaying a list of scripts with search and filter functionality. */
export const ScriptsSection = ({
  scripts,
  title,
  className,
  parentSubject,
  scriptsUnavailable = false,
  showControls = { all: true, search: true, filters: true, create: true },
  emptyMessage,
  headerActions,
  ...rest
}: ScriptsSectionProps) => {
  const ui = useUIStrings()
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
      className={cn('ui-stack ui-above h-fit', className)}
      {...rest}
    >
      <SectionHeader
        title={title ?? ui.scripts.sectionTitle}
        titleVariant='subHeading'
        count={scriptsUnavailable ? undefined : visibleScripts.length}
        actions={headerActions}
      />

      {!scriptsUnavailable && showControls?.all && (
        <Box className='ui-cluster items-stretch justify-between gap-3'>
          {showControls?.search && (
            <SearchBar
              inputVal={query}
              inputOnChange={(event) => setQuery(event.target.value)}
              className='min-w-[50%]'
            />
          )}

          {showControls?.filters && (
            <ScriptFilters
              subject={subject}
              subjects={subjectOptions}
              sort={sort}
              onSubjectChange={setSubject}
              onSortChange={setSort}
            />
          )}
          {parentSubject && showControls?.create && (
            <CreateScriptModal subject={parentSubject} />
          )}
        </Box>
      )}

      {scriptsUnavailable ? (
        <Text className='ui-above-inside ui-subtitle border-dashed px-6 py-14 text-center'>
          {ui.scripts.loadFailed}
        </Text>
      ) : (
        <ScriptList
          scripts={shownScripts}
          emptyMessage={emptyMessage ?? ui.scripts.emptyState}
        />
      )}

      {hasMore && (
        <Button className='button subtle w-full gap-2 py-3 ui-body'>
          <Text>{ui.scripts.browseAll}</Text> <ChevronDownIcon />
        </Button>
      )}
    </Box>
  )
}
