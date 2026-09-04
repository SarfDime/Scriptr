import ChevronDown from '@sanity/icons/ChevronDown'
import { cn } from '@/lib/common-utils'
import type { Script } from '@/types/components/Scripts.types'
import { Box } from '../common/Box'
import { Button } from '../common/Button'
import { Text } from '../typography/Text'
import { Title } from '../typography/Title'
import { ScriptCard } from './ScriptCard'
import { ScriptFilters, type SortOption } from './ScriptFilters'

interface ScriptsSectionProps {
  scripts: Array<Script>
  subjectOptions: Array<string>
  subject: string
  sort: SortOption
  onSubjectChange: (value: string) => void
  onSortChange: (value: SortOption) => void
  savedIds: Array<number>
  likedIds: Array<number>
  onToggleSaved: (id: number) => void
  onToggleLiked: (id: number) => void
}

export const ScriptsSection = ({
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
    <Box as='section'>
      <Box className='mb-5 flex flex-wrap items-center justify-between gap-3'>
        <Box>
          <Title as='h2' className='text-xl font-medium tracking-tight'>
            Continue learning
          </Title>
          <Text className='mt-1 text-sm text-fg-400'>
            Scripts from your subjects and community.
          </Text>
        </Box>
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
        <Box className='rounded-xl border border-dashed border-grey-300 px-6 py-14 text-center text-sm text-fg-400'>
          No scripts match that search.
        </Box>
      )}

      <Button className={cn('button basic', 'mt-5 w-full gap-2 py-3 text-sm')}>
        Browse all scripts <ChevronDown />
      </Button>
    </Box>
  )
}
