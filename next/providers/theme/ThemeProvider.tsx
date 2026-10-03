'use client'

import { createContext, use, useEffect, useState } from 'react'
import { useLoading } from '../loading/LoadingProvider'

export type ThemeMode = 'auto' | 'light' | 'dark'

type ThemeContextType = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)
const storageKey = 'scriptr-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('auto')
  const { startTask, finishTask } = useLoading()

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    const root = document.documentElement
    if (newMode === 'auto') {
      root.removeAttribute('data-theme')
    } else {
      root.dataset.theme = newMode
    }
    window.localStorage.setItem(storageKey, newMode)
  }

  useEffect(() => {
    startTask('theme')

    const savedMode = window.localStorage.getItem(
      storageKey
    ) as ThemeMode | null
    if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'auto') {
      setModeState(savedMode)
      if (savedMode !== 'auto') {
        document.documentElement.dataset.theme = savedMode
      }
    }

    finishTask('theme')
  }, [startTask, finishTask])

  return <ThemeContext value={{ mode, setMode }}>{children}</ThemeContext>
}

export function useTheme() {
  const context = use(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
