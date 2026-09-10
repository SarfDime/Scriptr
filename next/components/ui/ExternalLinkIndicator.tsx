import Launch from '@sanity/icons/Launch'
import { externalLink } from '@/lib/common-utils'
import type { SanityIconProps } from '../../types/component.types'

/** ExternalLinkIndicator is a component that renders a LaunchIcon if
 * the given href is an external link.
 */
export const ExternalLinkIndicator = ({
  href,
}: { href?: string } & SanityIconProps) => {
  return <>{href && externalLink(href)?.isExternal && <Launch />}</>
}
