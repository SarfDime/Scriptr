'use client'

import BookmarkIcon from '@sanity/icons/Bookmark'
import { UI_STRINGS } from '@shared/config/strings'
import { portableTextToPlainText } from '@shared/utils/portable-text.utils'
import { getScriptSitePath } from '@shared/utils/site-paths'
import { catalogUrl } from '@/lib/study-origin'
import { useMyProfile } from '@/providers/ProfileProvider'
import { Box } from '../common/Box'
import { NextLink } from '../common/NextLink'
import { Text } from '../typography/Text'
import { Divider } from '../ui/Divider'

const MAX_FAVORITES = 5

/** The viewer's most recent favorites, from the profile the app already
 * loads (newest first). Hidden for guests and while there are none. */
export const NavFavorites = () => {
  const profileState = useMyProfile()
  if (profileState.status !== 'loaded') return null

  const favorites = profileState.profile.favorite_scripts
  if (favorites.length === 0) return null

  return (
    <Box
      as='section'
      aria-label={UI_STRINGS.navigation.favorites}
      className='ui-stack gap-1'
    >
      <Text className='ui-nav-caption px-2.5'>
        {UI_STRINGS.navigation.favorites}
      </Text>
      {favorites.slice(0, MAX_FAVORITES).map((script) => (
        <NextLink
          key={script.id}
          href={getScriptSitePath({
            siteSlug: script.study?.site_slug,
            slug: script.slug,
          })}
          className='group button button-sm basic w-full justify-start gap-1 p-1 text-left'
        >
          <BookmarkIcon className='shrink-0 group-hover:text-amber' />
          <Text className='truncate'>
            {portableTextToPlainText(script.title).trim()}
          </Text>
        </NextLink>
      ))}
      <Divider className='my-2' />

      {favorites.length > MAX_FAVORITES && (
        <NextLink
          href={catalogUrl('/user')}
          className='button ghost button-sm w-full my-1'
        >
          {UI_STRINGS.navigation.favoritesShowAll}
        </NextLink>
      )}
    </Box>
  )
}
