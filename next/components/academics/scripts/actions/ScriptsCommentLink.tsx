import CommentIcon from '@sanity/icons/Comment'
import { COMMENTS_SECTION_ID } from '@shared/config/shared-constants'
import { generatePath } from '@shared/utils/common-utils'
import { NextLink } from '@/components/common/NextLink'
import { getAcademicPath } from '@/lib/academic-routes'
import { cn } from '@/lib/common-utils'
import type { ScriptCommentsLinkProps } from '@/types/components/Scripts.types'

/** Shows the comment count for a script and links through to its detail
 * page — comments themselves aren't editable from the card, so this is a
 * link, not a toggle, and needs no local state.
 */
export const ScriptCommentsLink = ({
  id,
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
        getAcademicPath({ scriptSlug: id, type: 'script' }),
        `#${COMMENTS_SECTION_ID}`,
      ],
    })}
    className={cn(
      'ui-caption flex items-center gap-1.5 p-2 hover:text-brand',
      className
    )}
    aria-label={`View comments on ${scriptTitle}`}
  >
    <CommentIcon {...iconProps} className={iconProps?.className} />
    {comments}
  </NextLink>
)
