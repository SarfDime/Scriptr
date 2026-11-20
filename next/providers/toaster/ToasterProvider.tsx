'use client'

import { TOAST_TIMEOUT } from '@shared/config/next-constants'
import { createContext, useContext, useState } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

export type ToasterType = {
  id: string
  title: string
  description?: string
  type: ToastType
  duration?: number
  onClick?: () => void
  href?: string
}

type ToastContextType = {
  toasts: Array<ToasterType>
  addToast: (toast: Omit<ToasterType, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Array<ToasterType>>([])

  const addToast = ({
    title,
    type,
    description,
    href,
    onClick,
    duration = TOAST_TIMEOUT,
  }: Omit<ToasterType, 'id'>) => {
    // biome-ignore lint/nursery/useReactCompiler: `addToast` runs from an event handler, not during render.
    const id = Math.random().toString(36).substring(2, 11)
    setToasts((prev) => [
      { id, title, type, description, href, onClick, duration },
      ...prev,
    ])

    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
