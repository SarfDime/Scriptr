import CommentIcon from '@sanity/icons/Comment'
import { COMMENTS_SECTION_ID } from '@shared/config/shared-constants'
import { UI_STRINGS } from '@shared/config/strings'
import { generatePath } from '@shared/utils/common-utils'
import { NextLink } from '@/components/common/NextLink'
import { getAcademicPath } from '@/lib/academic-routes'
import { cn, convertToPlainText } from '@/lib/common-utils'
import type { ScriptCommentsLinkProps } from '@/types/components/Scripts.types'

/** Shows the comment count for a script and links through to its detail
 * page — comments themselves aren't editable from the card, so this is a
 * link, not a toggle, and needs no local state.
 */
export const ScriptCommentsLink = ({
  slug,
  siteSlug,
  scriptTitle,
  comments,
  className,
  iconProps,
  ...props
}: ScriptCommentsLinkProps) => (
  <NextLink
    {...props}
    href={generatePath({
      segments: [
        getAcademicPath({ type: 'script', scriptSlug: slug, siteSlug }),
        `#${COMMENTS_SECTION_ID}`,
      ],
    })}
    className={cn(
      'ui-caption flex items-center gap-1.5 p-2 hover:text-brand',
      className
    )}
    aria-label={UI_STRINGS.scripts.actions.viewComments(
      convertToPlainText({ value: scriptTitle })
    )}
  >
    <CommentIcon {...iconProps} className={iconProps?.className} />
    {comments}
  </NextLink>
)
