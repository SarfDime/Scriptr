'use client'

import { cn } from '../../lib/common-utils'
import { type ThemeMode, useTheme } from '../../providers/theme/ThemeProvider'

const modes: Array<{ value: ThemeMode; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export function ThemeToggle() {
  const { mode, setMode } = useTheme()

  return (
    <fieldset className='ui-theme-toggle'>
      <legend className='sr-only'>Color theme</legend>
      {modes.map(({ value, label }) => (
        <button
          className={cn('ui-theme-option', mode === value && 'is-active')}
          key={value}
          type='button'
          aria-pressed={mode === value}
          onClick={() => setMode(value)}
        >
          {label}
        </button>
      ))}
    </fieldset>
  )
}
