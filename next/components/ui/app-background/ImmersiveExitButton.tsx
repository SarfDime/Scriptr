'use client'

import CloseIcon from '@sanity/icons/Close'
import { useEffect, useState } from 'react'
import { Button } from '@/components/common/Button'
import { exitImmersive } from '@/lib/app-background/immersive-store'
import { useUIStrings } from '@/providers/locale/use-strings'

const HIDE_AFTER_MS = 3000

/**
 * The way out of immersive mode that needs no keyboard: a click no longer leaves it,
 * and where fullscreen is unavailable (iPhone Safari) there is no Escape either.
 * It shows on mount, on any pointer move or tap, and fades after a few seconds.
 * Mounted only while immersive, so each visit starts visible.
 */
export const ImmersiveExitButton = () => {
  const ui = useUIStrings()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let timer = 0
    const arm = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setVisible(false), HIDE_AFTER_MS)
    }
    const show = () => {
      setVisible(true)
      arm()
    }
    arm()
    window.addEventListener('pointermove', show, { passive: true })
    window.addEventListener('pointerdown', show, { passive: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pointermove', show)
      window.removeEventListener('pointerdown', show)
    }
  }, [])

  return (
    <Button
      aria-label={ui.general.exitImmersive}
      onClick={exitImmersive}
      tabIndex={visible ? 0 : -1}
      className={`button subtle fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-50 p-2 transition-opacity duration-300 motion-reduce:transition-none ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <CloseIcon aria-hidden />
    </Button>
  )
}
