'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { cn } from '@/lib/common-utils'
import { getDisplayName } from '@/lib/profile-display'
import { catalogUrl } from '@/lib/study-origin'
import { useMyProfile } from '@/providers/ProfileProvider'
import { useSession } from '@/providers/SessionProvider'
import { NextLink } from '../common/NextLink'
import { Avatar } from '../ui/Avatar'

/**
 * The signed-in user's avatar at the end of the header, linking to their
 * profile. Visible whenever the navbar is not docked open (always below lg;
 * from lg up only while it is collapsed) — when it is docked, the navbar's
 * own user card already links there. Photo when the profile has one,
 * initials otherwise. Renders nothing for guests, whose way in is the
 * navbar's sign-in link.
 */
export const HeaderProfileLink = () => {
  const { session } = useSession()
  const profileState = useMyProfile()

  if (session.status !== 'authenticated') return null

  const profile = profileState.status === 'loaded' ? profileState.profile : null
  const name = profile
    ? getDisplayName(profile)
    : (session.user.username ??
      session.user.email ??
      UI_STRINGS.navigation.account)

  return (
    <NextLink
      href={catalogUrl('/user')}
      aria-label={UI_STRINGS.profile.viewProfileAriaLabel}
      className={cn(
        'button ghost p-1',
        'xl:group-data-[nav-collapsed=false]/nav:hidden'
      )}
    >
      <Avatar
        name={name}
        picture={
          profile?.avatar_url
            ? {
                src: profile.avatar_url,
                className: 'h-6 w-6 rounded-full shadow-sm',
              }
            : undefined
        }
        // Only the box is set: `InitialsIcon` sizes its letters from the box, so
        // a padding and a font size here made the initials overflow it.
        initialsIconProps={{ className: 'h-6 w-6 rounded-full shadow-sm' }}
      />
    </NextLink>
  )
}
