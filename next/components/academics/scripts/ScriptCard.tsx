'use client'

// TODO: Should factor out the liked state and button into a separate component and make this server
import BookmarkIcon from '@sanity/icons/Bookmark'
import CommentIcon from '@sanity/icons/Comment'
import DocumentTextIcon from '@sanity/icons/DocumentText'
import DownloadIcon from '@sanity/icons/Download'
import HeartIcon from '@sanity/icons/Heart'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn, formatUpdated } from '@/lib/common-utils'
import type { ScriptCardProps } from '@/types/components/Scripts.types'

// TODO: Add JSDoc for all missing Script components
export const ScriptCard = ({ script }: ScriptCardProps) => {
  const [isSaved, setIsSaved] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const color = getColorPalette({ type: 'seed', value: script.id })
  const displayedLikes = script.likes + (isLiked ? 1 : 0)

  return (
    <Card>
      <Card.Body className='flex items-start gap-3'>
        <Box
          className={cn(
            color,
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'
          )}
        >
          <DocumentTextIcon />
        </Box>

        <Box className='ui-stack min-w-0 flex-1 gap-1'>
          <Box className='ui-cluster items-center gap-2'>
            <Text className='ui-title'>{script.title}</Text>
            {script.tag && <Badge colorPalette={color}>{script.tag}</Badge>}
          </Box>
          <Text className='ui-caption text-grey-500'>
            {script.subject}
            {script.professor && ` • ${script.professor}`}
            {script.year !== undefined && ` • Year ${script.year}`}
          </Text>
          <Text className='ui-caption text-grey-400'>
            {script.author} • {formatUpdated(script.updatedAt)}
          </Text>
        </Box>

        <Button
          onClick={() => setIsSaved((current) => !current)}
          className={cn('button subtle p-2', isSaved && 'text-golden-yellow')}
          aria-label={
            isSaved
              ? `Remove ${script.title} from favorites`
              : `Add ${script.title} to favorites`
          }
        >
          <BookmarkIcon fill={isSaved ? 'currentColor' : 'none'} />
        </Button>
      </Card.Body>

      <Card.Footer className='ui-cluster flex-wrap items-center gap-2'>
        <Button
          onClick={() => setIsLiked((current) => !current)}
          className={cn(
            'button subtle gap-1.5 px-2 py-1',
            isLiked && 'text-rose-pink'
          )}
          aria-label={`${isLiked ? 'Unlike' : 'Like'} ${script.title}`}
        >
          <HeartIcon fill={isLiked ? 'currentColor' : 'none'} />
          {displayedLikes}
        </Button>

        <Text className='ui-caption flex items-center gap-1.5 px-2 py-1'>
          <CommentIcon />
          {script.comments}
        </Text>

        <Box className='ml-auto ui-cluster gap-2'>
          <Button className='button basic gap-1.5 px-2.5 py-1.5 ui-caption'>
            <DownloadIcon /> Download
          </Button>
          <Button className='button solid px-3 py-1.5 ui-caption'>
            Preview
          </Button>
        </Box>
      </Card.Footer>
    </Card>
  )
}
