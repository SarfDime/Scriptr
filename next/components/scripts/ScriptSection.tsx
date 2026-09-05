import ChevronDown from '@sanity/icons/ChevronDown'
import { UI_STRINGS } from '@shared/config/strings'
import { cn } from '@/lib/common-utils'
import type { ScriptsSectionProps } from '@/types/components/Scripts.types'
import { Box } from '../common/Box'
import { Button } from '../common/Button'
import { PortableTextContent } from '../typography/PortableTextContent'
import { Text } from '../typography/Text'
import { ScriptCard } from './ScriptCard'
import { ScriptFilters } from './ScriptFilters'

export const ScriptsSection = ({
  content,
  scripts,
  subjectOptions,
  subject,
  sort,
  onSubjectChange,
  onSortChange,
  savedIds,
  likedIds,
  onToggleSaved,
  onToggleLiked,
}: ScriptsSectionProps) => {
  return (
    <Box as='section' className='ui-stack gap-5'>
      <Box className='ui-cluster items-start justify-between gap-3'>
        <PortableTextContent>{content}</PortableTextContent>
        <ScriptFilters
          subject={subject}
          subjects={subjectOptions}
          sort={sort}
          onSubjectChange={onSubjectChange}
          onSortChange={onSortChange}
        />
      </Box>

      <Box className='ui-stack gap-3'>
        {scripts.map((script) => (
          <ScriptCard
            key={script.id}
            script={script}
            isSaved={savedIds.includes(script.id)}
            isLiked={likedIds.includes(script.id)}
            onToggleSaved={onToggleSaved}
            onToggleLiked={onToggleLiked}
          />
        ))}
      </Box>

      {scripts.length === 0 && (
        <Text className='ui-subtitle rounded-xl border border-dashed border-grey-300 px-6 py-14 text-center'>
          {UI_STRINGS.scripts.emptyState}
        </Text>
      )}

      <Button className={cn('button subtle', 'w-full gap-2 py-3 ui-body')}>
        <Text>{UI_STRINGS.scripts.browseAll}</Text> <ChevronDown />
      </Button>
    </Box>
  )
}
