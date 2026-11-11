'use client'

import type { SkyState } from '@shared/types/skybox.types'
import { useSyncExternalStore } from 'react'

// The live sky, shared with the other background canvases. The skybox writes it at
// most once a second (the sky changes slowly); readers get a new object only then,
// so a canvas that reads the tint does not re-render per frame.
//
// The static half of the contract — where the horizon, the sunrise and the sunset
// are — is SKY_ANCHORS in shared/config/skybox.ts, because a canvas that paints
// once still has to line up with a sun that moves all day.

let current: SkyState | null = null
const listeners = new Set<() => void>()

export const setSkyState = (next: SkyState) => {
  current = next
  for (const listener of listeners) listener()
}

export const getSkyState = () => current

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** The current sky, or null before the skybox has run (and on the server). */
export const useSkyState = (): SkyState | null =>
  useSyncExternalStore(subscribe, getSkyState, () => null)
