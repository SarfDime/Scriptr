import { UI_STRINGS } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import type {
  SearchPageViewModel,
  SearchResultGroups,
  SearchResultItem,
} from '@/types/components/Search.types'

const search = UI_STRINGS.scripts.search

const GROUPS: ReadonlyArray<{
  key: keyof SearchResultGroups
  label: string
}> = [
  { key: 'universities', label: UI_STRINGS.academics.entity.university },
  { key: 'faculties', label: UI_STRINGS.academics.entity.faculty },
  { key: 'studies', label: UI_STRINGS.academics.entity.study },
  { key: 'professors', label: UI_STRINGS.academics.entity.professor },
]

const ResultGroup = ({
  label,
  items,
}: {
  label: string
  items: Array<SearchResultItem>
}) => {
  if (items.length === 0) return null

  return (
    <Box className='ui-stack gap-1'>
      <Text className='ui-label'>{label}</Text>
      {items.map((item) => (
        <NextLink
          key={item.id}
          href={item.href}
          className='group button button-sm basic w-full justify-start gap-2 p-2 text-left'
        >
          <Text className='truncate'>{item.name}</Text>
          {item.context && (
            <Text className='ui-caption truncate'>{item.context}</Text>
          )}
        </NextLink>
      ))}
    </Box>
  )
}

/** Results for a submitted query, or a prompt while there isn't one yet.
 * Catalog entities only — a study's own content is searched inside that study. */
export const SearchResults = ({
  query,
  results,
  failed,
}: SearchPageViewModel) => {
  if (!query)
    return <Text className='ui-above ui-subtitle'>{search.prompt}</Text>

  if (failed)
    return (
      <Box as='section' role='alert' className='ui-stack ui-above h-fit'>
        <Text className='ui-subtitle'>{search.loadFailed}</Text>
      </Box>
    )

  const total = GROUPS.reduce((sum, { key }) => sum + results[key].length, 0)

  return (
    <Box as='section' className='ui-stack ui-above h-fit'>
      <SectionHeader
        title={search.resultsTitle}
        subtitle={search.resultsSubtitle(query)}
        count={total}
      />
      {total === 0 ? (
        <Text className='ui-subtitle'>{search.noResults(query)}</Text>
      ) : (
        <Box className='ui-stack gap-4'>
          {GROUPS.map(({ key, label }) => (
            <ResultGroup key={key} label={label} items={results[key]} />
          ))}
        </Box>
      )}
    </Box>
  )
}
