import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import type { ScriptSummary } from '@shared/types/scripts.types'
import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'

/** The script's rich-text description, with an empty state. */
export function ScriptDescription({
  description,
}: {
  description: ScriptSummary['description']
}) {
  return (
    <Box className='ui-stack gap-4 ui-above'>
      <SectionHeader title={SCRIPT_STRINGS.description.title} />
      <Box className='ui-above-inside'>
        {description ? (
          <PortableTextContent>{description}</PortableTextContent>
        ) : (
          <Text className='ui-caption'>{SCRIPT_STRINGS.description.empty}</Text>
        )}
      </Box>
    </Box>
  )
}
