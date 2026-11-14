'use client'

import type { LocaleId } from '@shared/config/localization-constants'
import { COMMENT_STRINGS_PACK } from '@shared/strings/comments-strings'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import {
  getAuthorDisplayName,
  getAuthorProfileHref,
} from '@/lib/comments/comment-author'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useStrings } from '@/providers/locale/use-strings'
import type { CommentHeaderProps } from '@/types/components/comments/CommentThread.types'
import { CommentAuthorAvatar } from './CommentAuthorAvatar'

/** Built once per language: the date sits between a name and the "edited" cue,
 * so it should read in the same language as both. */
const COMMENT_DATE_FORMAT = {
  en: new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }),
  mk: new Intl.DateTimeFormat('mk-MK', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }),
} satisfies Record<LocaleId, Intl.DateTimeFormat>

/** Author row above the comment text: avatar, name (linked to their profile
 * when they have one), date, and a "replying to" cue for flattened replies. */
export function CommentHeader({
  author,
  createdAt,
  isRoot,
  edited = false,
  replyingTo,
}: CommentHeaderProps) {
  const { locale } = useLocale()
  const strings = useStrings(COMMENT_STRINGS_PACK)
  const name = getAuthorDisplayName(author, strings)
  const profileHref = getAuthorProfileHref(author)

  return (
    <Box className='ui-cluster gap-x-2 gap-y-0'>
      {profileHref ? (
        <NextLink
          href={profileHref}
          className='ui-cluster gap-2 hover:text-brand'
        >
          <CommentAuthorAvatar
            name={name}
            avatarUrl={author?.avatar_url}
            isRoot={isRoot}
          />
          <Text className='ui-label'>{name}</Text>
        </NextLink>
      ) : (
        <Box className='ui-cluster gap-2'>
          <CommentAuthorAvatar
            name={name}
            avatarUrl={author?.avatar_url}
            isRoot={isRoot}
          />
          <Text className='ui-label'>{name}</Text>
        </Box>
      )}
      <time dateTime={createdAt} className='ui-caption'>
        {COMMENT_DATE_FORMAT[locale].format(new Date(createdAt))}
      </time>
      {edited && <Text className='ui-caption'>{strings.general.edited}</Text>}
      {replyingTo && (
        <Text className='ui-caption'>
          {strings.reply.replyingTo(replyingTo)}
        </Text>
      )}
    </Box>
  )
}
