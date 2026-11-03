import { UI_STRINGS } from '@shared/config/strings'
import { ScriptList } from '@/components/academics/scripts/ScriptList'
import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import type { SearchPageViewModel } from '@/types/components/Search.types'

const { search } = UI_STRINGS.scripts

/** Results for a submitted query, or a prompt while there isn't one yet. */
export const SearchResults = ({
  query,
  scripts,
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

  return (
    <Box as='section' className='ui-stack ui-above h-fit'>
      <SectionHeader
        title={search.resultsTitle}
        subtitle={search.resultsSubtitle(query)}
        count={scripts.length}
      />
      <ScriptList scripts={scripts} emptyMessage={search.noResults(query)} />
    </Box>
  )
}
