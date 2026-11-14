'use client'

import Sparkles from '@sanity/icons/Sparkles'
import { useSyncExternalStore } from 'react'
import { Box } from '@/components/common/Box'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import { dayNumber, pickByDay } from '@/lib/daily-pick'
import { useUIStrings } from '@/providers/locale/use-strings'
import type { StudyTipData } from '@/types/components/StudyTip.types'

const subscribeToDay = () => () => {
  // The pick only moves at UTC midnight, which a page load or a new render
  // handles; there is no external store to subscribe to.
}
const getClientDay = () => dayNumber(Date.now())

type NavStudyTipProps = {
  tips: ReadonlyArray<StudyTipData>
  /** The day the server rendered. Cached pages can be older than today, so the
   * first client render matches the HTML and then switches to the browser's
   * clock — the same deterministic pick, never a hydration mismatch. */
  serverDay: number
}

/**
 * One study tip per UTC day, rotating through the published tips. The list is
 * fetched once by the root layout (cached Sanity content); the day is picked
 * here so a static or ISR page does not freeze on the day it was built.
 */
export const NavStudyTip = ({ tips, serverDay }: NavStudyTipProps) => {
  const strings = useUIStrings()
  const day = useSyncExternalStore(
    subscribeToDay,
    getClientDay,
    () => serverDay
  )
  const tip = pickByDay(tips, day)
  const colorPalette = getColorPalette({
    type: 'seed',
    value: `${tip?.title.length}`,
  })
  if (!tip) return null

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
