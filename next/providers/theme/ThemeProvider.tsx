'use client'

import { createContext, use, useEffect, useState } from 'react'
import { subscribeToStorage } from '@/lib/storage-events'
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

/** Mirrors the mode onto `<html data-theme>`, where CSS picks it up; `auto`
 * leaves the attribute off so the system preference applies. */
const applyMode = (mode: ThemeMode) => {
  const root = document.documentElement
  if (mode === 'auto') {
    root.removeAttribute('data-theme')
  } else {
    root.dataset.theme = mode
  }
}

/** Mirrors simple mode onto <html data-simple> so CSS can react to it. */
const applySimpleMode = (enabled: boolean) => {
  const root = document.documentElement
  if (enabled) {
    root.dataset.simple = 'true'
  } else {
    root.removeAttribute('data-simple')
  }
}

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === 'light' || value === 'dark' || value === 'auto'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('auto')
  const [simpleMode, setSimpleModeState] = useState(false)
  const { startTask, finishTask } = useLoading()

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    applyMode(newMode)
    window.localStorage.setItem(storageKey, newMode)
  }

  const setSimpleMode = (enabled: boolean) => {
    setSimpleModeState(enabled)
    applySimpleMode(enabled)
    window.localStorage.setItem(simpleModeStorageKey, String(enabled))
  }

  useEffect(() => {
    startTask('theme')

    const savedMode = window.localStorage.getItem(storageKey)
    if (isThemeMode(savedMode)) {
      setModeState(savedMode)
      applyMode(savedMode)
    }

    if (window.localStorage.getItem(simpleModeStorageKey) === 'true') {
      setSimpleModeState(true)
      applySimpleMode(true)
    }

    finishTask('theme')
  }, [startTask, finishTask])

  // Another tab changed a preference: follow it here too, without writing the
  // value back (a write would be a no-op, but the tidy path is to just apply).
  useEffect(() => {
    const stopMode = subscribeToStorage(storageKey, (value) => {
      const next = isThemeMode(value) ? value : 'auto'
      setModeState(next)
      applyMode(next)
    })

    const stopSimpleMode = subscribeToStorage(simpleModeStorageKey, (value) => {
      const enabled = value === 'true'
      setSimpleModeState(enabled)
      applySimpleMode(enabled)
    })

    return () => {
      stopMode()
      stopSimpleMode()
    }
  }, [])

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
