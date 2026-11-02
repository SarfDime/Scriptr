import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { cn } from '@/lib/common-utils'

export const ADMIN_SECTIONS = {
  flags: { href: '/admin/flags', label: ADMIN_STRINGS.flagsTitle },
  restrictions: {
    href: '/admin/restrictions',
    label: ADMIN_STRINGS.restrictionsTitle,
  },
  'rating-types': {
    href: '/admin/rating-types',
    label: ADMIN_STRINGS.ratingTypesTitle,
  },
  'achievement-definitions': {
    href: '/admin/achievement-definitions',
    label: ADMIN_STRINGS.achievementDefinitionsTitle,
  },
} as const

export type AdminSection = keyof typeof ADMIN_SECTIONS

/** Plain links, like `ScriptFeedToggle`: the section lives in the URL, so the
 * admin pages stay Server Components and each passes its own `current`. */
export const AdminNavigation = ({ current }: { current: AdminSection }) => (
  <Box as='nav' aria-label={ADMIN_STRINGS.title} className='ui-cluster gap-1'>
    {Object.entries(ADMIN_SECTIONS).map(([key, { href, label }]) => (
      <NextLink
        key={key}
        href={href}
        aria-current={key === current ? 'page' : undefined}
        className={cn('button button-sm', key === current ? 'solid' : 'subtle')}
      >
        {label}
      </NextLink>
    ))}
  </Box>
)
