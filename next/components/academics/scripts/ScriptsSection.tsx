'use client'

import ChevronDownIcon from '@sanity/icons/ChevronDown'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { useScriptExplorer } from '@/hooks/useScriptExplorer'
import { cn } from '@/lib/common-utils'
import { useUIStrings } from '@/providers/locale/use-strings'
import type { ScriptsSectionProps } from '@/types/components/Scripts.types'
import { CreateScriptModal } from './CreateScriptModal'
import { ScriptFilters } from './ScriptFilters'
import { ScriptList } from './ScriptList'
import { ScriptSearchBar, ScriptSearchFilter } from './ScriptSearchControls'

/** Scripts a list shows before its first Show more. */
const INITIAL_PAGE_SIZE = 4

/** A component that renders a section displaying a list of scripts with search and filter functionality. */
export const ScriptsSection = ({
  scripts,
  title,
  className,
  parentSubject,
  parentSubjectStudyId,
  scriptsUnavailable = false,
  showControls,
  searchPath,
  searchQuery,
  initialPageSize,
  pageSize,
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

  const controls = {
    all: true,
    search: true,
    filters: true,
    subjectFilter: true,
    create: true,
    ...showControls,
  }
  const step = pageSize ?? INITIAL_PAGE_SIZE
  const [visibleCount, setVisibleCount] = useState(initialPageSize ?? step)
  const shownScripts = visibleScripts.slice(0, visibleCount)
  const hasMore = visibleScripts.length > visibleCount

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

      {!scriptsUnavailable && controls.all && (
        <Box className='ui-cluster items-stretch justify-between gap-3'>
          {controls.search &&
            (searchQuery !== undefined && searchPath !== undefined ? (
              <ScriptSearchBar path={searchPath} query={searchQuery} />
            ) : (
              <ScriptSearchFilter
                query={query}
                onQueryChange={setQuery}
                searchPath={searchPath}
              />
            ))}

          {searchQuery === undefined && controls.filters && (
            <ScriptFilters
              subject={subject}
              subjects={subjectOptions}
              sort={sort}
              onSubjectChange={setSubject}
              onSortChange={setSort}
              showSubject={controls.subjectFilter}
            />
          )}
          {parentSubject && controls.create && (
            <CreateScriptModal
              subject={parentSubject}
              studyId={parentSubjectStudyId}
            />
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
        <Button
          onClick={() => setVisibleCount((count) => count + step)}
          className='button subtle w-full gap-2 py-3 ui-body'
        >
          <Text>{ui.general.showMore}</Text> <ChevronDownIcon />
        </Button>
      )}
    </Box>
  )
}
