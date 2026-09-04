import Bookmark from '@sanity/icons/Bookmark'
import Comment from '@sanity/icons/Comment'
import DocumentText from '@sanity/icons/DocumentText'
import Download from '@sanity/icons/Download'
import Heart from '@sanity/icons/Heart'
import { cn, paletteClass } from '@/lib/common-utils'
import type { Script } from '@/types/components/Scripts.types'
import { Box } from '../common/Box'
import { Button } from '../common/Button'
import { Text } from '../typography/Text'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

interface ScriptCardProps {
  script: Script
  isSaved: boolean
  isLiked: boolean
  onToggleSaved: (id: number) => void
  onToggleLiked: (id: number) => void
}

export const ScriptCard = ({
  script,
  isSaved,
  isLiked,
  onToggleSaved,
  onToggleLiked,
}: ScriptCardProps) => {
  const displayedLikes = script.likes + (isLiked && !script.liked ? 1 : 0)

  return (
    <Card className={cn(paletteClass(script.color), 'p-4')}>
      <Card.Body className='flex items-start gap-4 p-0'>
        <Box
          className={cn(
            'hidden h-12 w-12 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold sm:flex'
          )}
        >
          <DocumentText strokeWidth={1.5} />
        </Box>

        <Box className='min-w-0 flex-1'>
          <Box className='flex flex-wrap items-center gap-2'>
            <Text className='truncate text-sm font-medium text-fg-700'>
              {script.title}
            </Text>
            <Badge colorPalette={script.color}>{script.tag}</Badge>
          </Box>
          <Text className='mt-1.5 text-xs text-fg-400'>
            {script.subject} <span className='px-1 text-grey-400'>•</span>{' '}
            {script.professor} <span className='px-1 text-grey-400'>•</span>{' '}
            {script.year}
          </Text>
          <Text className='mt-1 text-xs text-fg-400'>
            Shared by {script.author}{' '}
            <span className='px-1 text-grey-400'>•</span> {script.updated}
          </Text>
        </Box>

        <Button
          onClick={() => onToggleSaved(script.id)}
          className={cn('button subtle p-2', isSaved && 'text-golden-yellow')}
          aria-label={
            isSaved
              ? `Remove ${script.title} from favorites`
              : `Add ${script.title} to favorites`
          }
        >
          <Bookmark fill={isSaved ? 'currentColor' : 'none'} />
        </Button>
      </Card.Body>

      <Card.Footer
        className={cn(
          'mt-4 flex flex-wrap items-center gap-2 border-t border-grey-300 pt-3'
        )}
      >
        <Button
          onClick={() => onToggleLiked(script.id)}
          className={cn(
            'button subtle',
            'gap-1.5 px-2 py-1 text-xs',
            isLiked && 'text-rose-pink'
          )}
          aria-label={`${isLiked ? 'Unlike' : 'Like'} ${script.title}`}
        >
          <Heart fill={isLiked ? 'currentColor' : 'none'} />
          {displayedLikes}
        </Button>

        <Text className='flex items-center gap-1.5 px-2 py-1 text-xs text-fg-400'>
          <Comment />
          {script.comments}
        </Text>

        <Box className='ml-auto flex items-center gap-2'>
          <Button
            className={cn('button basic', 'gap-1.5 px-2.5 py-1.5 text-xs')}
          >
            <Download />
            Download
          </Button>
          <Button className='button solid px-3 py-1.5 text-xs'>Preview</Button>
        </Box>
      </Card.Footer>
    </Card>
  )
}
