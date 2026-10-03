import DocumentTextIcon from '@sanity/icons/DocumentText'
import { Box } from '@/components/common/Box'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn, formatUpdated } from '@/lib/common-utils'
import type { ScriptCardProps } from '@/types/components/Scripts.types'
import { ScriptActions } from './actions/ScriptActions'

/** Renders a single script as a card: a colored document icon, its title
 * and optional tag, subject/professor/year context, author and last-
 * updated info, and the full set of script actions.
 */
export const ScriptCard = ({ script }: ScriptCardProps) => {
  const color = getColorPalette({ type: 'seed', value: script.id })

  return (
    <Card className='ui-above'>
      <Card.Body className='flex items-start gap-3'>
        <Box
          className={cn(
            color,
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'
          )}
        >
          <DocumentTextIcon />
        </Box>

        <Box className='ui-stack grow gap-1'>
          <Box className='ui-cluster items-center gap-1 grow justify-between'>
            <PortableTextContent className='ui-title'>
              {script.title}
            </PortableTextContent>
            {script.tag && <Badge colorPalette={color}>{script.tag}</Badge>}
          </Box>
          <Text className='ui-caption text-grey-500'>
            {script.subject}
            {script.professor && ` • ${script.professor}`}
            {script.year !== undefined && ` • Year ${script.year}`}
          </Text>
          <Text className='ui-caption text-grey-400'>
            {script.author} • {formatUpdated(script.updatedAt)}
          </Text>
        </Box>
      </Card.Body>

      <Card.Footer className='ui-cluster flex-wrap items-center gap-2'>
        <ScriptActions
          id={script.id}
          scriptTitle={script.title}
          likes={script.likes}
          comments={script.comments}
          title={script.title}
          files={script.files ?? []}
        />
      </Card.Footer>
    </Card>
  )
}
