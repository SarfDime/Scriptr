import { UI_STRINGS } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { cn } from '@/lib/common-utils'

export type ScriptFeedToggleProps = {
  /** `true` when the platform-wide list is showing. */
  showAll: boolean
}

/**
 * Switches the homepage between the viewer's subject feed and every script on
 * the platform. Deliberately plain links: the choice lives in the URL, so the
 * homepage stays a Server Component and renders the right list on the first
 * paint instead of fetching twice or hydrating a control.
 */
export const ScriptFeedToggle = ({ showAll }: ScriptFeedToggleProps) => {
  const feed = UI_STRINGS.scripts.feed

  return (
    <Box
      role='group'
      aria-label={feed.toggleLabel}
      className='ui-cluster gap-1'
    >
      <NextLink
        href='/'
        aria-current={showAll ? undefined : 'page'}
        className={cn('button button-sm', showAll ? 'subtle' : 'solid')}
      >
        {feed.forYou}
      </NextLink>
      <NextLink
        href='/?scripts=all'
        aria-current={showAll ? 'page' : undefined}
        className={cn('button button-sm', showAll ? 'solid' : 'subtle')}
      >
        {feed.all}
      </NextLink>
    </Box>
  )
}
