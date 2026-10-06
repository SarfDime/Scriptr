import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import type { ScriptSummary } from '@shared/types/scripts.types'
import { Box } from '@/components/common/Box'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'

/** The script's rich-text description, with an empty state. */
export function ScriptDescription({
  description,
}: {
  description: ScriptSummary['description']
}) {
  return (
    <Box className='ui-stack'>
      <Text className='ui-title'>{SCRIPT_STRINGS.description.title}</Text>
      <Box className='ui-above-dark p-4 rounded-md'>
        {description ? (
          <PortableTextContent className='bg-background-100/60 p-4 rounded-lg'>
            {description}
          </PortableTextContent>
        ) : (
          <Text className='ui-caption text-grey-500'>
            {SCRIPT_STRINGS.description.empty}
          </Text>
        )}
      </Box>
    </Box>
  )
}
