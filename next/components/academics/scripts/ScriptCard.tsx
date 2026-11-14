'use client'

import DocumentTextIcon from '@sanity/icons/DocumentText'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { getAcademicPath } from '@/lib/academic-routes'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn, formatUpdated } from '@/lib/common-utils'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useUIStrings } from '@/providers/locale/use-strings'
import type { ScriptCardProps } from '@/types/components/Scripts.types'
import { ScriptActions } from './actions/ScriptActions'

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
  const color = getColorPalette({ type: 'seed', value: script.id })

  return (
    <Card
      className={cn(
        'group transition-colors hover:border-brand-300/50',
        className
      )}
      {...props}
    >
      <NextLink
        href={getAcademicPath(
          {
            type: 'script',
            scriptSlug: script.slug,
            siteSlug: script.siteSlug,
          },
          locale
        )}
        className='flex items-start gap-3'
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

        <Box className='ui-stack grow gap-1'>
          <Box className='ui-cluster gap-1 grow justify-between'>
            <PortableTextContent className='ui-title'>
              {script.title}
            </PortableTextContent>
            {script.tag && <Badge colorPalette={color}>{script.tag}</Badge>}
          </Box>
          <Text className='ui-caption'>
            {script.subject}
            {script.professor && ` • ${script.professor}`}
            {script.year !== undefined && ` • Year ${script.year}`}
          </Text>
          <Text className='ui-caption'>
            {script.author} • {formatUpdated(script.updatedAt)}
          </Text>
        </Box>
      </NextLink>

      <Card.Footer className='ui-cluster flex-wrap items-center gap-2 transition-colors duration-300 group-hover:border-t-brand-300'>
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
        />
      </Card.Footer>
    </Card>
  )
}
