import { SCRIPT_STRINGS_PACK } from '@shared/strings/scripts-strings'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'
import { getServerStrings } from '@/lib/server-strings'

/** The script's rich-text description, with an empty state. */
export async function ScriptDescription({
  description,
}: {
  /** Already resolved for the reader by `loadScriptDetailPage`. */
  description: PortableTextValue | null
}) {
  const strings = await getServerStrings(SCRIPT_STRINGS_PACK)

  return (
    <Box className='ui-stack gap-4 ui-above'>
      <SectionHeader title={strings.description.title} />
      <Box className='ui-above-inside'>
        {description ? (
          <PortableTextContent>{description}</PortableTextContent>
        ) : (
          <Text className='ui-caption'>{strings.description.empty}</Text>
        )}
      </Box>
    </Box>
  )
}
