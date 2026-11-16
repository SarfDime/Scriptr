'use client'

import { SKYBOX_DEFAULTS } from '@shared/config/skybox'
import type {
  WebsiteBackground,
  WebsiteSkybox,
} from '@shared/types/app-background.types'
import { useImmersive } from '@/lib/app-background/immersive-store'
import { useTheme } from '@/providers/theme/ThemeProvider'
import { ChristmasCanvas } from './ChristmasCanvas'
import { ImmersiveExitButton } from './ImmersiveExitButton'
import { SimpleBackground } from './SimpleBackground'
import { SkyboxCanvas } from './SkyboxCanvas'

/** Picks the page background from the document the website settings point at:
 * the skybox and the Christmas scenery for a `christmasCanvas`, and the static
 * brand gradient when nothing is configured or the visitor turned on simple mode.
 */
export const AppBackground = ({
  background,
  skybox,
}: {
  background?: WebsiteBackground | null
  skybox?: WebsiteSkybox | null
}) => {
  const { simpleMode } = useTheme()
  const immersive = useImmersive()
  // The skybox document also tunes the scenery's full-screen behaviour.
  const immersiveEnabled =
    skybox?.immersiveEnabled ?? SKYBOX_DEFAULTS.immersiveEnabled
  const paletteFadeMs =
    skybox?.immersiveFadeMs ?? SKYBOX_DEFAULTS.immersiveFadeMs

  if (simpleMode || !background) return <SimpleBackground />

  return (
    <div id='app-background'>
      <SkyboxCanvas sanityData={skybox} />
      <ChristmasCanvas
        sanityData={background}
        immersiveEnabled={immersiveEnabled}
        paletteFadeMs={paletteFadeMs}
      />
      {immersive && <ImmersiveExitButton />}
    </div>
  )
}
