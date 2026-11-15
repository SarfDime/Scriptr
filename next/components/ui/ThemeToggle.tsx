'use client'

import Desktop from '@sanity/icons/Desktop'
import Moon from '@sanity/icons/Moon'
import Sun from '@sanity/icons/Sun'
import { Fragment, type ReactNode } from 'react'
import { cn } from '../../lib/common-utils'
import { useUIStrings } from '../../providers/locale/use-strings'
import { type ThemeMode, useTheme } from '../../providers/theme/ThemeProvider'
import { Button } from '../common/Button'
import { Divider } from './Divider'

export function ThemeToggle({ className }: { className?: string }) {
  const UI_STRINGS = useUIStrings()
  const { mode, setMode } = useTheme()

  // The labels are translated, so the list is built where the language is
  // known rather than once at module scope.
  const modes: Array<{ value: ThemeMode; label: string; icon: ReactNode }> = [
    {
      value: 'light',
      label: UI_STRINGS.general.themeLight,
      icon: <Sun className='h-5 w-5 overwrite shrink-0' />,
    },
    {
      value: 'auto',
      label: UI_STRINGS.general.themeAuto,
      icon: <Desktop className='h-5 w-5 overwrite shrink-0' />,
    },
    {
      value: 'dark',
      label: UI_STRINGS.general.themeDark,
      icon: <Moon className='h-5 w-5 overwrite shrink-0' />,
    },
  ]

  return (
    <fieldset
      className={cn(
        'ui-above-inside p-1.5 gap-0 flex flex-col w-fit mx-auto',
        className
      )}
    >
      <legend className='sr-only'>{UI_STRINGS.general.colorTheme}</legend>
      {modes.map(({ value, label }, index) => (
        <Fragment key={value}>
          {index > 0 && <Divider orientation='vertical' aria-hidden='true' />}
          <Button
            className={'button ghost grow pr-1 pl-0.5 py-2 text-sm rounded-lg'}
            isActive={mode === value}
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
          >
            {modes.find((modeObj) => modeObj.value === value)?.icon}
            {label}
          </Button>
        </Fragment>
      ))}
    </fieldset>
  )
}
