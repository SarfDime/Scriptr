'use client'

import type { WebsiteBackground } from '@shared/types/app-background.types'
import { useTheme } from '@/providers/theme/ThemeProvider'
import { CustomStarCanvas } from '../StarCanvas'
import { ChristmasCanvas } from './ChristmasCanvas'
import { SimpleBackground } from './SimpleBackground'
import { SkyboxCanvas } from './SkyboxCanvas'

/** Picks the page background from the document the website settings point at:
 * the skybox and the Christmas scenery for a `christmasCanvas`, the animated
 * star field for a `starCanvas`, and a static brand gradient when neither is
 * configured or the visitor turned on simple mode.
 */
export const AppBackground = ({
  background,
}: {
  background?: WebsiteBackground | null
}) => {
  const { simpleMode } = useTheme()

  if (simpleMode || !background) return <SimpleBackground />
  if (background._type === 'christmasCanvas') {
    return (
      <div id='app-background'>
        <SkyboxCanvas />
        <ChristmasCanvas sanityData={background} />
      </div>
    )
  }
  return <CustomStarCanvas sanityData={background} />
}
