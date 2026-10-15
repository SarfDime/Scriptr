'use client'

import { createContext, use, useEffect, useState } from 'react'
import { useLoading } from '../loading/LoadingProvider'

export type ThemeMode = 'auto' | 'light' | 'dark'

type ThemeContextType = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  /** Disables blur, transparency, animations and the animated background. */
  simpleMode: boolean
  setSimpleMode: (enabled: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)
const storageKey = 'scriptr-theme'
const simpleModeStorageKey = 'scriptr-simple-mode'

/** Mirrors simple mode onto <html data-simple> so CSS can react to it. */
const applySimpleMode = (enabled: boolean) => {
  const root = document.documentElement
  if (enabled) {
    root.dataset.simple = 'true'
  } else {
    root.removeAttribute('data-simple')
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('auto')
  const [simpleMode, setSimpleModeState] = useState(false)
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

  const setSimpleMode = (enabled: boolean) => {
    setSimpleModeState(enabled)
    applySimpleMode(enabled)
    window.localStorage.setItem(simpleModeStorageKey, String(enabled))
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

    if (window.localStorage.getItem(simpleModeStorageKey) === 'true') {
      setSimpleModeState(true)
      applySimpleMode(true)
    }

    finishTask('theme')
  }, [startTask, finishTask])

  return (
    <ThemeContext value={{ mode, setMode, simpleMode, setSimpleMode }}>
      {children}
    </ThemeContext>
  )
}

export function useTheme() {
  const context = use(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
