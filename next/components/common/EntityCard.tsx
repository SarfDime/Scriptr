import type { ReactNode } from 'react'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { ClickableCard } from '@/components/ui/Card'

export type EntityCardStat = {
  label: string
  value: number | string
}

type EntityCardProps = {
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

const defaultClassName =
  'group p-4 h-full ui-stack gap-2 transition hover:border-brand-500 hover:shadow-sm'

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
    <ClickableCard href={href} className={className ?? defaultClassName}>
      <ClickableCard.Body className='flex items-start gap-3 flex-1 min-w-0'>
        {media}

        <Box className='ui-stack gap-0.5 min-w-0 flex-1'>
          <Title
            as='h3'
            className='ui-body font-semibold group-hover:text-brand truncate'
          >
            {title}
          </Title>

          {subtitle && (
            <Text className='ui-caption text-grey-500 truncate'>
              {subtitle}
            </Text>
          )}

          {caption && (
            <Text className='ui-caption text-grey-400 font-medium truncate'>
              {caption}
            </Text>
          )}

          {secondaryCaption && (
            <Text className='ui-caption text-grey-400 font-medium truncate'>
              {secondaryCaption}
            </Text>
          )}
        </Box>

        {headerAside}
      </ClickableCard.Body>

      {footer ??
        (stats && stats.length > 0 && (
          <ClickableCard.Footer className='ui-cluster gap-2 mt-auto text-grey-500 pt-2'>
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
