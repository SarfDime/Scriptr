'use client'

import Desktop from '@sanity/icons/Desktop'
import Moon from '@sanity/icons/Moon'
import Sun from '@sanity/icons/Sun'
import { UI_STRINGS } from '@shared/config/strings'
import type { ReactNode } from 'react'
import { cn } from '../../lib/common-utils'
import { type ThemeMode, useTheme } from '../../providers/theme/ThemeProvider'
import { Button } from '../common/Button'

const modes: Array<{ value: ThemeMode; label: string; icon: ReactNode }> = [
  { value: 'light', label: UI_STRINGS.general.themeLight, icon: <Sun /> },
  { value: 'auto', label: UI_STRINGS.general.themeAuto, icon: <Desktop /> },
  { value: 'dark', label: UI_STRINGS.general.themeDark, icon: <Moon /> },
]

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useTheme()

  return (
    <fieldset
      className={cn(
        'ui-above-inside p-1.5 gap-1.5 flex flex-col w-fit mx-auto',
        className
      )}
    >
      <legend className='sr-only'>{UI_STRINGS.general.colorTheme}</legend>
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
