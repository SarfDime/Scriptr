import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import { ScriptPanel } from '@/components/academics/scripts/ScriptPanel'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { getLinkAddress, getLinkLabel } from '@/lib/script-detail'

/** Reading list shown beside the script info: one raised row per link with
 * the site name as the headline and the rest of the address underneath. The
 * panel is always shown; with no links it carries an empty-state message. */
export function ScriptAdditionalReading({ links }: { links: Array<string> }) {
  return (
    <ScriptPanel
      aria-label={SCRIPT_STRINGS.additionalReading.title}
      className='min-w-0 grow basis-[14rem] gap-3'
    >
      <Box className='ui-cluster items-center gap-2'>
        <Text className='ui-title'>
          {SCRIPT_STRINGS.additionalReading.title}
        </Text>
        {links.length > 0 && (
          <Text className='ui-caption text-grey-500'>{links.length}</Text>
        )}
      </Box>
      {links.length === 0 ? (
        <Text className='ui-caption text-grey-500'>
          {SCRIPT_STRINGS.additionalReading.empty}
        </Text>
      ) : (
        <Box as='ul' className='ui-stack gap-2'>
          {links.map((link) => (
            <Box as='li' key={link} className='min-w-0'>
              <ReadingLink link={link} />
            </Box>
          ))}
        </Box>
      )}
    </ScriptPanel>
  )
}

function ReadingLink({ link }: { link: string }) {
  const label = getLinkLabel(link)
  const address = getLinkAddress(link)

  return (
    <NextLink
      href={link}
      externalIconProps={{ className: 'shrink-0' }}
      className='ui-above flex items-center justify-between gap-3 rounded-lg p-3 transition-colors hover:text-brand focus-visible:text-brand'
    >
      <Box className='ui-stack min-w-0 gap-0.5'>
        <Text className='ui-label truncate'>{label}</Text>
        {/* A bare domain would only repeat the headline. */}
        {address !== label && (
          <Text className='ui-caption truncate text-grey-500'>{address}</Text>
        )}
      </Box>
    </NextLink>
  )
}
