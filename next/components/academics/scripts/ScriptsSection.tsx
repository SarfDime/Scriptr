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
import { ScriptFilters } from './ScriptFilters'
import { ScriptList } from './ScriptList'

const VISIBLE_LIMIT = 5

/** A component that renders a section displaying a list of scripts with search and filter functionality. */
export const ScriptsSection = ({
  scripts,
  title = UI_STRINGS.scripts.sectionTitle,
  subtitle = UI_STRINGS.scripts.sectionSubtitle,
  className,
  parentSubject,
  scriptsUnavailable = false,
  showControls = { all: true, search: true, filters: true, create: true },
  emptyMessage = UI_STRINGS.scripts.emptyState,
  headerActions,
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
      className={cn('ui-stack ui-above h-fit', className)}
      {...rest}
    >
      <SectionHeader
        title={title}
        subtitle={subtitle}
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
          {UI_STRINGS.scripts.loadFailed}
        </Text>
      ) : (
        <ScriptList scripts={shownScripts} emptyMessage={emptyMessage} />
      )}

      {hasMore && (
        <Button className='button subtle w-full gap-2 py-3 ui-body'>
          <Text>{UI_STRINGS.scripts.browseAll}</Text> <ChevronDownIcon />
        </Button>
      )}
    </Box>
  )
}
