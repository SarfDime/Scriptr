import Bookmark from '@sanity/icons/Bookmark'
import Comment from '@sanity/icons/Comment'
import DocumentText from '@sanity/icons/DocumentText'
import Download from '@sanity/icons/Download'
import Heart from '@sanity/icons/Heart'
import { cn, paletteClass } from '@/lib/common-utils'
import type { ScriptCardProps } from '@/types/components/Scripts.types'
import { Box } from '../common/Box'
import { Button } from '../common/Button'
import { Text } from '../typography/Text'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

export const ScriptCard = ({
  script,
  isSaved,
  isLiked,
  onToggleSaved,
  onToggleLiked,
}: ScriptCardProps) => {
  const displayedLikes = script.likes + (isLiked && !script.liked ? 1 : 0)

  return (
    <Card>
      <Card.Body className='flex items-start gap-3'>
        <DocumentText
          className={cn('h-10 w-10 rounded-md p-1', paletteClass(script.color))}
        />

        <Box className='ui-stack min-w-0 flex-1 gap-1'>
          <Box className='flex flex-wrap items-center gap-2'>
            <Text className='ui-title'>{script.title}</Text>
            {script.tag && (
              <Badge colorPalette={script.color}>{script.tag}</Badge>
            )}
          </Box>
          <Text className='ui-body'>
            {script.subject} <span>•</span> {script.professor} <span>•</span>{' '}
            {script.year}
          </Text>
          <Text className='ui-body'>
            {script.author}
            {script.updated && (
              <>
                <span className='px-1 text-grey-400'>•</span> {script.updated}
              </>
            )}
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

      <Card.Footer className={cn('flex flex-wrap items-center gap-2 pt-3')}>
        <Button
          onClick={() => onToggleLiked(script.id)}
          className={cn(
            'button subtle',
            'gap-1.5 px-2 py-1',
            isLiked && 'text-rose-pink'
          )}
          aria-label={`${isLiked ? 'Unlike' : 'Like'} ${script.title}`}
        >
          <Heart fill={isLiked ? 'currentColor' : 'none'} />
          {displayedLikes}
        </Button>

        <Text className='flex items-center gap-1.5 px-2 py-1'>
          <Comment />
          {script.comments}
        </Text>

        <Box className='ml-auto flex items-center gap-2'>
          <Button className={cn('button basic', 'gap-1.5 px-2.5 py-1.5')}>
            <Download />
            Download
          </Button>
          <Button className='button solid px-3 py-1.5'>Preview</Button>
        </Box>
      </Card.Footer>
    </Card>
  )
}
