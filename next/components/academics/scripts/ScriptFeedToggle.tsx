import { UI_STRINGS_PACK } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { cn } from '@/lib/common-utils'
import { getServerStrings } from '@/lib/server-strings'

export type ScriptFeedToggleProps = {
  /** `true` when the study's whole list is showing. */
  showAll: boolean
  /** The page the switch lives on — a study's home. */
  basePath: string
}

/**
 * Switches a study's feed between the viewer's subjects and every script in
 * that study. Deliberately plain links: the choice lives in the URL, so the page
 * stays a Server Component and renders the right list on the first paint
 * instead of fetching twice or hydrating a control.
 */
export const ScriptFeedToggle = async ({
  showAll,
  basePath,
}: ScriptFeedToggleProps) => {
  const ui = await getServerStrings(UI_STRINGS_PACK)
  const feed = ui.scripts.feed

  return (
    <Box
      role='group'
      aria-label={feed.toggleLabel}
      className='ui-cluster gap-1'
    >
      <NextLink
        href={basePath}
        aria-current={showAll ? undefined : 'page'}
        isActive={!showAll}
        disabled={!showAll}
        className={cn('button button-sm subtle')}
      >
        {feed.forYou}
      </NextLink>
      <NextLink
        href={`${basePath}?scripts=all`}
        aria-current={showAll ? 'page' : undefined}
        isActive={showAll}
        disabled={showAll}
        className={cn('button button-sm subtle')}
      >
        {feed.all}
      </NextLink>
    </Box>
  )
}
