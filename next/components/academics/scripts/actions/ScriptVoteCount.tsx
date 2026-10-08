import Heart from '@sanity/icons/Heart'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'

/** Read-only upvote count for script cards. Cards render on many pages —
 * some static, with no session cookie to look up the viewer's own vote — so
 * voting itself lives on the detail page (`ScriptVoteButton`, server-seeded).
 */
export const ScriptVoteCount = ({
  votes,
  className,
}: {
  votes: number
  className?: string
}) => (
  <Box className={cn('ui-caption flex items-center gap-1.5 p-2', className)}>
    <Heart />
    <Text>{votes}</Text>
    <Text className='sr-only'>{votes === 1 ? 'upvote' : 'upvotes'}</Text>
  </Box>
)
