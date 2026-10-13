'use client'

import Desktop from '@sanity/icons/Desktop'
import Moon from '@sanity/icons/Moon'
import Sun from '@sanity/icons/Sun'
import type { ReactNode } from 'react'
import { cn } from '../../lib/common-utils'
import { type ThemeMode, useTheme } from '../../providers/theme/ThemeProvider'
import { Button } from '../common/Button'

const modes: Array<{ value: ThemeMode; label: string; icon: ReactNode }> = [
  { value: 'light', label: 'Light', icon: <Sun /> },
  { value: 'auto', label: 'Auto', icon: <Desktop /> },
  { value: 'dark', label: 'Dark', icon: <Moon /> },
]

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useTheme()

  return (
    <fieldset
      className={cn(
        'border-grey-300 border rounded-xl bg-background-200 p-1.5 gap-1.5 flex flex-col w-fit mx-auto',
        className
      )}
    >
      <legend className='sr-only'>Color theme</legend>
      {modes.map(({ value, label }) => (
        <Button
          className={'button ghost grow px-1.5 py-2 text-sm rounded-lg'}
          isActive={mode === value}
          key={value}
          aria-pressed={mode === value}
          onClick={() => setMode(value)}
        >
          {modes.find((modeObj) => modeObj.value === value)?.icon}
          {label}
        </Button>
      ))}
    </fieldset>
  )
}
