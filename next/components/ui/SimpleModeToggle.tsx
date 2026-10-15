'use client'

import Bolt from '@sanity/icons/Bolt'
import { UI_STRINGS } from '@shared/config/strings'
import { cn } from '../../lib/common-utils'
import { useTheme } from '../../providers/theme/ThemeProvider'
import { Button } from '../common/Button'

/** Switches simple mode (no blur, transparency, animations or animated
 * background) on and off. Meant to sit next to the ThemeToggle.
 */
export function SimpleModeToggle({ className }: { className?: string }) {
  const { simpleMode, setSimpleMode } = useTheme()

  return (
    <Button
      className={cn(
        'button subtle w-full gap-1.5 px-1.5 py-2 text-sm rounded-lg',
        className
      )}
      isActive={simpleMode}
      aria-pressed={simpleMode}
      title={UI_STRINGS.navigation.simpleModeDescription}
      onClick={() => setSimpleMode(!simpleMode)}
    >
      <Bolt />
      {UI_STRINGS.navigation.simpleMode}
    </Button>
  )
}
