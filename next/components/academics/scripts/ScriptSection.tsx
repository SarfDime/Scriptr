'use client'

import ChevronDownIcon from '@sanity/icons/ChevronDown'
import SearchIcon from '@sanity/icons/Search'
import { UI_STRINGS } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { useScriptExplorer } from '@/hooks/useScriptExplorer'
import { cn } from '@/lib/common-utils'
import { buildSearchHref } from '@/lib/script-search'
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
  showGlobalSearch = false,
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
  const trimmedQuery = query.trim()
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
        count={visibleScripts.length}
        actions={headerActions}
      />

      <Box className='ui-cluster items-stretch justify-between gap-3'>
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

      <ScriptList
        scripts={shownScripts}
        emptyMessage={UI_STRINGS.scripts.emptyState}
      />

      {showGlobalSearch && trimmedQuery && (
        <NextLink
          href={buildSearchHref(trimmedQuery)}
          className='button subtle w-full gap-2 py-3 ui-body'
        >
          <SearchIcon />
          <Text>{UI_STRINGS.scripts.search.searchAll(trimmedQuery)}</Text>
        </NextLink>
      )}

      {hasMore && (
        <Button className='button subtle w-full gap-2 py-3 ui-body'>
          <Text>{UI_STRINGS.scripts.browseAll}</Text> <ChevronDownIcon />
        </Button>
      )}
    </Box>
  )
}
