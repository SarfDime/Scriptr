import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import {
  getAuthorDisplayName,
  getAuthorProfileHref,
} from '@/lib/comments/comment-author'
import type { CommentHeaderProps } from '@/types/components/comments/CommentThread.types'
import { CommentAuthorAvatar } from './CommentAuthorAvatar'

/** Author row above the comment text: avatar, name (linked to their profile
 * when they have one), date, and a "replying to" cue for flattened replies. */
export function CommentHeader({
  author,
  createdAt,
  isRoot,
  replyingTo,
}: CommentHeaderProps) {
  const name = getAuthorDisplayName(author)
  const profileHref = getAuthorProfileHref(author)

  return (
    <Box className='ui-cluster items-center gap-x-2 gap-y-0'>
      {profileHref ? (
        <NextLink
          href={profileHref}
          className='ui-cluster items-center gap-2 hover:text-brand'
        >
          <CommentAuthorAvatar
            name={name}
            avatarUrl={author?.avatar_url}
            isRoot={isRoot}
          />
          <Text className='ui-label'>{name}</Text>
        </NextLink>
      ) : (
        <Box className='ui-cluster items-center gap-2'>
          <CommentAuthorAvatar
            name={name}
            avatarUrl={author?.avatar_url}
            isRoot={isRoot}
          />
          <Text className='ui-label text-grey-500'>{name}</Text>
        </Box>
      )}
      <Text className='ui-caption text-grey-500'>
        {new Date(createdAt).toLocaleDateString()}
      </Text>
      {replyingTo && (
        <Text className='ui-caption text-grey-500'>
          {COMMENT_STRINGS.reply.replyingTo(replyingTo)}
        </Text>
      )}
    </Box>
  )
}
