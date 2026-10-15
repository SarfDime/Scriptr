'use client'

import { useTheme } from '@/providers/theme/ThemeProvider'
import { SimpleBackground } from './SimpleBackground'
import { CustomStarCanvas, type StarCanvasSanityData } from './StarCanvas'

/** Picks the page background: the animated StarCanvas when one is configured
 * in Sanity, otherwise (or in simple mode) a static brand gradient.
 */
export const AppBackground = ({
  sanityData,
}: {
  sanityData?: StarCanvasSanityData | null
}) => {
  const { simpleMode } = useTheme()

  if (simpleMode || !sanityData) return <SimpleBackground />
  return <CustomStarCanvas sanityData={sanityData} />
}
