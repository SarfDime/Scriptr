import Sparkles from '@sanity/icons/Sparkles'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import { getServerStrings } from '@/lib/server-strings'
import type { StudyTipData } from '@/types/components/StudyTip.types'

/** Any of the published tips, so a reader who comes back sees a different one.
 * The choice is per render, not per day: nothing here has to outlive the
 * response, and a cached page simply keeps the tip its render picked. */
const pickTip = (
  tips: ReadonlyArray<StudyTipData>
): StudyTipData | undefined =>
  tips.length > 0 ? tips[Math.floor(Math.random() * tips.length)] : undefined

/**
 * One of the published study tips. A Server Component — the tip is picked and
 * rendered with the rest of the page, so neither the copy nor the picker's
 * markup reaches the browser.
 */
export const NavStudyTip = async ({
  tips,
}: {
  tips: ReadonlyArray<StudyTipData>
}) => {
  const strings = await getServerStrings(UI_STRINGS_PACK)
  const tip = pickTip(tips)
  if (!tip) return null

  const colorPalette = getColorPalette({
    type: 'seed',
    value: `${tip.title.length}`,
  })

  return (
    <Box
      as='section'
      aria-label={strings.navigation.studyTip}
      className={cn('ui-stack gap-2 mt-auto', colorPalette, 'cp-vars')}
    >
      <Text className={cn('ui-nav-caption px-2.5 ui-cluster justify-between')}>
        {strings.navigation.studyTip}
        <Sparkles
          aria-hidden='true'
          className={cn('mt-0.5 size-4 shrink-0 cp-text')}
        />
      </Text>
      <Box className='rounded-xl ui-above-inside ui-stack gap-1.5 p-3'>
        <Box className='ui-cluster flex-nowrap items-start gap-1.5'>
          <PortableTextContent as='div' className={'ui-label cp-text'}>
            {tip.title}
          </PortableTextContent>
        </Box>
        <PortableTextContent as='div' className='ui-caption'>
          {tip.content}
        </PortableTextContent>
      </Box>
    </Box>
  )
}
