'use client'

import { cn } from '../../lib/common-utils'
import { type ThemeMode, useTheme } from '../../providers/theme/ThemeProvider'
import { Button } from '../common/Button'

const modes: Array<{ value: ThemeMode; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useTheme()

  return (
    <fieldset
      className={cn(
        'border-grey-300 border rounded-xl bg-background-100 p-1 gap-1 flex flex-col w-fit mx-auto',
        className
      )}
    >
      <legend className='sr-only'>Color theme</legend>
      {modes.map(({ value, label }) => (
        <Button
          className={'button ghost grow px-2 py-3 text-sm rounded-lg'}
          isActive={mode === value}
          key={value}
          aria-pressed={mode === value}
          onClick={() => setMode(value)}
        >
          {label}
        </Button>
      ))}
    </fieldset>
  )
}
