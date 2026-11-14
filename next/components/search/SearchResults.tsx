import { UI_STRINGS_PACK } from '@shared/config/strings'
import type { ReactNode } from 'react'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { getServerStrings } from '@/lib/server-strings'
import type {
  SearchPageViewModel,
  SearchResultGroups,
  SearchResultItem,
} from '@/types/components/Search.types'

const groupKeys: ReadonlyArray<keyof SearchResultGroups> = [
  'universities',
  'faculties',
  'studies',
  'professors',
]

const ResultGroup = ({
  label,
  items,
}: {
  label: ReactNode
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
 * Catalog entities only — a study's own content is searched inside that study.
 *
 * A Server Component: the result list and its messages are rendered in the
 * route's language on the server, so nothing here is hydrated. */
export const SearchResults = async ({
  query,
  results,
  failed,
}: SearchPageViewModel) => {
  const UI_STRINGS = await getServerStrings(UI_STRINGS_PACK)

  const groupLabels: Record<keyof SearchResultGroups, string> = {
    universities: UI_STRINGS.academics.entity.university,
    faculties: UI_STRINGS.academics.entity.faculty,
    studies: UI_STRINGS.academics.entity.study,
    professors: UI_STRINGS.academics.entity.professor,
  }

  if (!query)
    return (
      <Text className='ui-above ui-subtitle'>
        {UI_STRINGS.scripts.search.prompt}
      </Text>
    )

  if (failed)
    return (
      <Box as='section' role='alert' className='ui-stack ui-above h-fit'>
        <Text className='ui-subtitle'>
          {UI_STRINGS.scripts.search.loadFailed}
        </Text>
      </Box>
    )

  const total = groupKeys.reduce((sum, key) => sum + results[key].length, 0)

  return (
    <Box as='section' className='ui-stack ui-above h-fit'>
      <SectionHeader
        title={UI_STRINGS.scripts.search.resultsTitle}
        subtitle={UI_STRINGS.scripts.search.resultsSubtitle(query)}
        count={total}
      />
      {total === 0 ? (
        <Text className='ui-subtitle'>
          {UI_STRINGS.scripts.search.noResults(query)}
        </Text>
      ) : (
        <Box className='ui-stack gap-4'>
          {groupKeys.map((key) => (
            <ResultGroup
              key={key}
              label={groupLabels[key]}
              items={results[key]}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}
