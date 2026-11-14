import { SCRIPT_STRINGS_PACK } from '@shared/strings/scripts-strings'
import type { ScriptSummary } from '@shared/types/scripts.types'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/common-utils'
import { getAuthorDisplay } from '@/lib/script-detail'
import { getServerStrings } from '@/lib/server-strings'

/** The script's uploader, given more weight than the other details: avatar,
 * name and handle in a raised block that links to their profile. */
export async function ScriptAuthorCard({
  author,
}: {
  author: ScriptSummary['author']
}) {
  const strings = await getServerStrings(SCRIPT_STRINGS_PACK)
  const { name, username, avatarUrl, profileHref } = getAuthorDisplay(
    author,
    strings
  )
  const className = 'flex items-center gap-3 rounded-lg p-3'
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
        <Text className='ui-caption group-hover:text-brand'>
          {strings.info.uploadedBy}
        </Text>
        <Text className='ui-label truncate group-hover:text-brand-350'>
          {name}
        </Text>
        {username && (
          <Text className='ui-caption truncate group-hover:text-brand-300'>
            @{username}
          </Text>
        )}
      </Box>
    </>
  )

  return profileHref ? (
    <NextLink
      href={profileHref}
      className={cn(className, `group transition-colors hover:text-brand`)}
    >
      {content}
    </NextLink>
  ) : (
    <Box className={className}>{content}</Box>
  )
}
