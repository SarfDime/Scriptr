'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'auto' | 'light' | 'dark'

type ThemeContextType = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)
const storageKey = 'scriptr-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('auto')

  useEffect(() => {
    const savedMode = window.localStorage.getItem(storageKey)
    if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'auto') {
      setMode(savedMode)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (mode === 'auto') {
      root.removeAttribute('data-theme')
    } else {
      root.dataset.theme = mode
    }
    window.localStorage.setItem(storageKey, mode)
  }, [mode])

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
