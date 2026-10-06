import { Box } from '@/components/common/Box'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/common-utils'
import type { CommentAuthorAvatarProps } from '@/types/components/comments/CommentThread.types'

/** Round avatar for a comment author: their picture, or initials as a fallback. */
export function CommentAuthorAvatar({
  name,
  avatarUrl,
  isRoot,
}: CommentAuthorAvatarProps) {
  return (
    <Box
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full',
        isRoot ? 'h-7 w-7' : 'h-6 w-6'
      )}
    >
      <Avatar
        name={name}
        picture={
          avatarUrl
            ? {
                src: avatarUrl,
                // Decorative: the author's name is rendered right next to it.
                alt: '',
                className: 'p-0 rounded-full',
              }
            : undefined
        }
        initialsIconProps={{
          className: cn('p-0', isRoot ? 'text-xs' : 'text-[10px]'),
        }}
      />
    </Box>
  )
}
