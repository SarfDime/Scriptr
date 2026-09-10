'use client'

import ChevronDownIcon from '@sanity/icons/ChevronDown'
import { UI_STRINGS } from '@shared/config/strings'
import { Box, type BoxProps } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Badge } from '@/components/ui/Badge'
import { useScriptExplorer } from '@/hooks/useScriptExplorer'
import { cn } from '@/lib/common-utils'
import type { ScriptDetail } from '@/types/components/Scripts.types'
import { SearchBar } from '../../typography/SearchBar'
import { ScriptCard } from './ScriptCard'
import { ScriptFilters } from './ScriptFilters'

const VISIBLE_LIMIT = 5

type ScriptsSectionProps = {
  scripts: Array<ScriptDetail>
} & Omit<BoxProps, 'children'>

/** A component that renders a section displaying a list of scripts with search and filter functionality. */
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
        <Title as='h2' className='ui-title font-bold'>
          {UI_STRINGS.scripts.sectionTitle}
        </Title>
        <Badge className='cp-brand'>{visibleScripts.length}</Badge>
      </Box>
      <Text className='ui-caption text-grey-500'>
        {UI_STRINGS.scripts.sectionSubtitle}
      </Text>

      <Box className='ui-cluster items-start justify-between gap-3'>
        <SearchBar
          inputVal={query}
          inputOnChange={(event) => setQuery(event.target.value)}
        />

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
