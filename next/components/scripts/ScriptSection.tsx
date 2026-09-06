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
  // TODO: Remove handlers and liked ids and saved ids, look at ScriptCard, only scripts and subject should be passed down
  // TODO: Sorts and filters should probably be hooks that accept an array of scripts and return the filtered and/or sorted array, ScriptFilters should only be ui to handle that
  className,
  ...rest
}: ScriptsSectionProps) => {
  return (
    <Box {...rest} as='section' className={cn('ui-stack gap-5', className)}>
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
        {/* TODO: Should only show up to a certain number of scripts, e.g., 10 and the rest would be scrollable, or maybe paginated */}
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

      {scripts.length < 1 && (
        <Text className='ui-subtitle rounded-xl border border-dashed border-grey-300 px-6 py-14 text-center'>
          {UI_STRINGS.scripts.emptyState}
        </Text>
      )}

      {/* Or maybe this button should open this section as a modal, and it should be only shown when there are more scripts than the initial visible limit */}
      <Button className={cn('button subtle', 'w-full gap-2 py-3 ui-body')}>
        <Text>{UI_STRINGS.scripts.browseAll}</Text> <ChevronDown />
      </Button>
    </Box>
  )
}
