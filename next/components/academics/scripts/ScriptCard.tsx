'use client'

import Circle from '@sanity/icons/Circle'
import DocumentTextIcon from '@sanity/icons/DocumentText'
import { formatDate } from '@shared/utils/common-utils'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { getAcademicPath } from '@/lib/academic-routes'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import { useRelativeNow } from '@/providers/clock/clock'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useUIStrings } from '@/providers/locale/use-strings'
import type { ScriptCardProps } from '@/types/components/Scripts.types'
import { ScriptActions } from './actions/ScriptActions'
import { ScriptDownloadCount } from './actions/ScriptDownloadCount'

/** Renders a single script as a card: a colored document icon, its title
 * and optional tag, subject/professor/year context, author and last-
 * updated info, and the full set of script actions.
 */
export const ScriptCard = ({
  script,
  className,
  ...props
}: ScriptCardProps) => {
  const { locale } = useLocale()
  const ui = useUIStrings()
  const relativeNow = useRelativeNow()
  const color = getColorPalette({ type: 'seed', value: script.id })

  return (
    <Card
      className={cn('ui-card-clickable cp-vars group pb-0', className, color)}
      {...props}
    >
      <Box className='flex items-start gap-3'>
        <NextLink
          href={getAcademicPath(
            {
              type: 'script',
              scriptSlug: script.slug,
              siteSlug: script.siteSlug,
            },
            locale
          )}
          className='flex min-w-0 grow items-start gap-3'
          aria-label={ui.scripts.actions.openScript(script.author)}
        >
          <Box
            className={cn(
              color,
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'
            )}
          >
            <DocumentTextIcon />
          </Box>

          <Box className='ui-stack min-w-0 grow gap-0'>
            <PortableTextContent className='ui-title group-hover:cp-text *:line-clamp-1'>
              {script.title}
            </PortableTextContent>
            <Text className='ui-caption'>
              {script.subject}
              {script.professor && ` • ${script.professor}`}
              {script.year !== undefined &&
                ` • ${ui.general.year(script.year)}`}
            </Text>
          </Box>
        </NextLink>

        <Box className='ui-cluster shrink-0 items-center gap-2'>
          {script.tag && <Badge colorPalette={color}>{script.tag}</Badge>}
          <ScriptDownloadCount downloads={script.downloads} className='p-0' />
        </Box>
      </Box>

      <Card.Footer className='ui-cluster flex-wrap items-center gap-2 py-2 transition-colors duration-300 group-hover:cp-border'>
        <ScriptActions
          id={script.id}
          slug={script.slug}
          siteSlug={script.siteSlug}
          scriptTitle={script.title}
          likes={script.likes}
          comments={script.comments}
          title={script.title}
          description={script.description}
          files={script.files ?? []}
        >
          <Text className='ui-caption flex items-center gap-1.25'>
            <Text as='span' className='block max-w-[5ch] truncate'>
              {script.author}
            </Text>
            <Circle className='overwrite size-2 fill-current' />
            <Text as='span'>
              {formatDate(script.updatedAt.toISOString(), locale, relativeNow)}
            </Text>
          </Text>
        </ScriptActions>
      </Card.Footer>
    </Card>
  )
}
