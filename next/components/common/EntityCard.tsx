import type { ReactNode } from 'react'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { ClickableCard } from '@/components/ui/Card'
import { cn } from '@/lib/common-utils'

export type EntityCardStat = {
  label: string
  value: number | string
}

export type EntityCardProps = {
  href: string
  title: string
  /** Avatar, InitialsIcon, or any leading visual — omit for text-only cards. */
  media?: ReactNode
  /** Single-line secondary text under the title (e.g. a title/role, or a code). */
  subtitle?: string | null
  /** Single-line tertiary text under the subtitle (e.g. "University • Faculty"). */
  caption?: string
  /** Optional fourth text line, for cards that need two secondary lines (e.g. faculty then university). */
  secondaryCaption?: string
  /** Small node rendered top-right of the header row (e.g. a code badge). */
  headerAside?: ReactNode
  /** Simple label/value pairs rendered as a bullet-separated meta row. Ignored if `footer` is passed. */
  stats?: Array<EntityCardStat>
  /** Full custom footer — takes over from `stats` when the footer isn't a simple stat list. */
  footer?: ReactNode
  className?: string
}

/**
 * `min-w-0 overflow-hidden` on the card root: when the card is a flex/grid
 * item, its min-content width would otherwise be the longest `truncate`d
 * (nowrap) line, so long text grows the card past its container instead of
 * truncating.
 */
const defaultClassName =
  'group p-4 h-full min-w-0 overflow-hidden ui-stack gap-2 transition hover:border-brand-500 hover:shadow-sm ui-above'

export const EntityCard = ({
  href,
  title,
  media,
  subtitle,
  caption,
  secondaryCaption,
  headerAside,
  stats,
  footer,
  className,
}: EntityCardProps) => {
  return (
    <ClickableCard href={href} className={cn(defaultClassName, className)}>
      <ClickableCard.Body className='ui-cluster min-w-0 flex-nowrap items-start gap-3'>
        {media && <Box className='shrink-0'>{media}</Box>}

        {/* min-w-0 + flex-1 lets this column shrink beside the media so the
            truncated lines below actually truncate. */}
        <Box className='ui-stack min-w-0 flex-1 gap-0.5'>
          <Box className='ui-cluster w-full min-w-0 flex-nowrap items-center justify-between gap-2'>
            <Title
              as='h3'
              className='ui-body min-w-0 truncate font-semibold group-hover:text-brand'
            >
              {title}
            </Title>
            {headerAside && <Box className='shrink-0'>{headerAside}</Box>}
          </Box>

          {subtitle && <Text className='ui-caption truncate'>{subtitle}</Text>}

          {caption && (
            <Text className='ui-caption truncate font-medium'>{caption}</Text>
          )}

          {secondaryCaption && (
            <Text className='ui-caption truncate font-medium'>
              {secondaryCaption}
            </Text>
          )}
        </Box>
      </ClickableCard.Body>

      {footer ??
        (stats && stats.length > 0 && (
          <ClickableCard.Footer className='ui-cluster mt-auto flex-wrap gap-2 pt-2'>
            {stats.map((stat, i) => (
              <Text key={stat.label} className='ui-caption'>
                {i > 0 && '• '}
                {stat.value} {stat.label}
              </Text>
            ))}
          </ClickableCard.Footer>
        ))}
    </ClickableCard>
  )
}
