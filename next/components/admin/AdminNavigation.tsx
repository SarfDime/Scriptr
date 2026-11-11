import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { cn } from '@/lib/common-utils'

/** `access` matches the API: a study admin moderates their own studies, and
 * everything org-wide (accounts, bans, rating types, achievements, broadcasts)
 * stays with the owner. */
export const ADMIN_SECTIONS = {
  flags: {
    href: '/admin/flags',
    label: ADMIN_STRINGS.flagsTitle,
    access: 'any',
  },
  users: {
    href: '/admin/users',
    label: ADMIN_STRINGS.usersTitle,
    access: 'owner',
  },
  restrictions: {
    href: '/admin/restrictions',
    label: ADMIN_STRINGS.restrictionsTitle,
    access: 'owner',
  },
  'download-review': {
    href: '/admin/download-review',
    label: ADMIN_STRINGS.downloadReviewTitle,
    access: 'study-admin',
  },
  'rating-types': {
    href: '/admin/rating-types',
    label: ADMIN_STRINGS.ratingTypesTitle,
    access: 'owner',
  },
  'achievement-definitions': {
    href: '/admin/achievement-definitions',
    label: ADMIN_STRINGS.achievementDefinitionsTitle,
    access: 'owner',
  },
  announcements: {
    href: '/admin/announcements',
    label: ADMIN_STRINGS.announcementsTitle,
    access: 'owner',
  },
} as const

export type AdminSection = keyof typeof ADMIN_SECTIONS

/** What the viewer may open, so a study admin is not offered a section whose
 * route would answer 403. */
export type AdminNavAccess = {
  isOwner: boolean
  /** Owners and study admins; download review needs the higher study role. */
  canReviewDownloads: boolean
}

const canSeeSection = (
  access: (typeof ADMIN_SECTIONS)[AdminSection]['access'],
  viewer: AdminNavAccess
): boolean => {
  if (access === 'owner') return viewer.isOwner
  if (access === 'study-admin') return viewer.canReviewDownloads
  return true
}

/** Plain links: the section lives in the URL, so the
 * admin pages stay Server Components and each passes its own `current`. */
export const AdminNavigation = ({
  current,
  viewer,
}: {
  current: AdminSection
  viewer: AdminNavAccess
}) => (
  <Box as='nav' aria-label={ADMIN_STRINGS.title} className='ui-cluster gap-1'>
    {Object.entries(ADMIN_SECTIONS)
      .filter(([, section]) => canSeeSection(section.access, viewer))
      .map(([key, { href, label }]) => (
        <NextLink
          key={key}
          href={href}
          aria-current={key === current ? 'page' : undefined}
          className={cn(
            'button button-sm',
            key === current ? 'solid' : 'subtle'
          )}
        >
          {label}
        </NextLink>
      ))}
  </Box>
)
