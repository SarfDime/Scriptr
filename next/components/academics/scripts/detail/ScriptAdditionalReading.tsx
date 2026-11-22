import { SCRIPT_STRINGS_PACK } from '@shared/strings/scripts-strings'
import { Suspense } from 'react'
import { ScriptPanel } from '@/components/academics/scripts/ScriptPanel'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { Divider } from '@/components/ui/Divider'
import { getLinkTitle } from '@/lib/link-title'
import { getLinkAddress, getLinkLabel } from '@/lib/script-detail'
import { getServerStrings } from '@/lib/server-strings'

/** Reading list shown beside the script info: one raised row per link with
 * the page's title as the headline (the host until it arrives) and the rest of
 * the address underneath. The panel is always shown; with no links it carries
 * an empty-state message. */
export async function ScriptAdditionalReading({
  links,
}: {
  links: Array<string>
}) {
  const strings = await getServerStrings(SCRIPT_STRINGS_PACK)

  return (
    <ScriptPanel
      aria-label={strings.additionalReading.title}
      className='min-w-0 grow basis-56 gap-2'
    >
      <SectionHeader
        title={strings.additionalReading.title}
        titleVariant='modern'
      />
      {links.length === 0 ? (
        <Text className='ui-caption'>{strings.additionalReading.empty}</Text>
      ) : (
        <>
          <Divider />
          <Box as='ul' className='ui-stack gap-1.5'>
            {links.map((link) => (
              <Box as='li' key={link} className='min-w-0'>
                {/* The host stands in until the page's own title arrives. */}
                <Suspense
                  fallback={
                    <ReadingLinkView link={link} label={getLinkLabel(link)} />
                  }
                >
                  <ReadingLink link={link} />
                </Suspense>
              </Box>
            ))}
          </Box>
        </>
      )}
    </ScriptPanel>
  )
}

async function ReadingLink({ link }: { link: string }) {
  const title = await getLinkTitle(link)
  return <ReadingLinkView link={link} label={title ?? getLinkLabel(link)} />
}

function ReadingLinkView({ link, label }: { link: string; label: string }) {
  const address = getLinkAddress(link)

  return (
    <NextLink
      href={link}
      externalIconProps={{ className: 'shrink-0 overwrite size-5' }}
      className='ui-above-reverse button button-sm ghost w-full justify-between gap-3 hover:text-brand focus-visible:text-brand p-2 rounded-lg'
    >
      <Box className='ui-stack min-w-0 gap-0.5'>
        <Text className='ui-label truncate'>{label}</Text>
        {/* A bare domain would only repeat the headline. */}
        {address !== label && (
          <Text className='ui-caption truncate'>{address}</Text>
        )}
      </Box>
    </NextLink>
  )
}
