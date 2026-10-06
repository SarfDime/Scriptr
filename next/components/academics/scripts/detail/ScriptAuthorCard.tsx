import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import type { ScriptSummary } from '@shared/types/scripts.types'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { Avatar } from '@/components/ui/Avatar'
import { getAuthorDisplay } from '@/lib/script-detail'

/** The script's uploader, given more weight than the other details: avatar,
 * name and handle in a raised block that links to their profile. */
export function ScriptAuthorCard({
  author,
}: {
  author: ScriptSummary['author']
}) {
  const { name, username, avatarUrl, profileHref } = getAuthorDisplay(author)
  const className = 'ui-above flex items-center gap-3 rounded-lg p-3'
  const content = (
    <>
      <Box className='relative h-12 w-12 shrink-0 overflow-hidden rounded-full'>
        <Avatar
          name={name}
          picture={
            avatarUrl
              ? {
                  src: avatarUrl,
                  // Decorative: the name is rendered right next to it.
                  alt: '',
                  className: 'p-0 rounded-full',
                }
              : undefined
          }
          initialsIconProps={{ className: 'p-0 text-lg' }}
        />
      </Box>
      <Box className='ui-stack min-w-0 gap-0.5'>
        <Text className='ui-caption text-grey-500'>
          {SCRIPT_STRINGS.info.uploadedBy}
        </Text>
        <Text className='ui-label truncate'>{name}</Text>
        {username && (
          <Text className='ui-caption truncate text-grey-500'>@{username}</Text>
        )}
      </Box>
    </>
  )

  return profileHref ? (
    <NextLink
      href={profileHref}
      className={`${className} transition-colors hover:text-brand`}
    >
      {content}
    </NextLink>
  ) : (
    <Box className={className}>{content}</Box>
  )
}
