'use client'

import Bolt from '@sanity/icons/Bolt'
import { cn } from '../../lib/common-utils'
import { useCopy } from '../../providers/locale/use-strings'
import { useTheme } from '../../providers/theme/ThemeProvider'
import { Button } from '../common/Button'

/** Switches simple mode (no transparency, animations or animated
 * background) on and off. Meant to sit next to the ThemeToggle.
 *
 * Copy as strings rather than nodes: `title` is an attribute, which an island
 * cannot set.
 */
export function SimpleModeToggle({ className }: { className?: string }) {
  const { simpleMode, setSimpleMode } = useTheme()
  const label = useCopy('navigation.simpleMode')
  const description = useCopy('navigation.simpleModeDescription')

  return (
    <Button
      className={cn(
        'button subtle w-full gap-1.5 px-1.5 py-2 text-sm rounded-lg',
        className
      )}
      isActive={simpleMode}
      aria-pressed={simpleMode}
      title={description}
      onClick={() => setSimpleMode(!simpleMode)}
    >
      <Bolt />
      {label}
    </Button>
  )
}
