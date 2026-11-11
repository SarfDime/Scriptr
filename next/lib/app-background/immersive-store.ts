'use client'

import { useSyncExternalStore } from 'react'

let immersive = false
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const setImmersive = (next: boolean) => {
  if (immersive === next) return

  immersive = next
  document.documentElement.classList.toggle('is-immersive', next)
  for (const listener of listeners) listener()
}

export const getImmersive = () => immersive

export const useImmersive = () =>
  useSyncExternalStore(subscribe, getImmersive, () => false)
