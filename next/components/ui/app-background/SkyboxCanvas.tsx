'use client'

import {
  SKY_SPEED_PARAM,
  SKY_TIME_PARAM,
  SKYBOX_DEFAULTS,
} from '@shared/config/skybox'
import type { SkyboxConfig } from '@shared/types/skybox.types'
import { getSkyState } from '@shared/utils/skybox-model'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useImmersive } from '@/lib/app-background/immersive-store'
import {
  buildClouds,
  buildStars,
  paintClouds,
  paintSky,
  paintStars,
  type SkyCloud,
  type SkyStar,
  scaleForMobile,
} from '@/lib/app-background/skybox-canvas'
import { setSkyState } from '@/lib/app-background/skybox-store'
import {
  createColorResolver,
  getIsMobile,
  getIsMobileOnServer,
  subscribeToMobile,
} from '@/lib/star-canvas'

// The shared sky behind every other background canvas: a vertical gradient, a
// faceted sun or moon, stars that fade in with the dark, and a few drifting clouds.
// It is the source of truth for where the sun and the moon are; the Christmas canvas
// paints its mountains on SKY_ANCHORS so the sun rises and sets behind the ridge.
//
// Two canvases keep the per-frame work small:
//  - the sky canvas (gradient, sun, moon) is repainted twice a second — the sky
//    changes slowly, except in immersive mode where it follows the 30 fps effects;
//  - the effects canvas is drawn live at a low frame cap: the stars and the clouds.
// The local time is only read inside the effect, so the server and the first client
// render agree. `?skyTime=HH:MM` pins the clock and `?skySpeed=1440` sweeps a day in
// a minute, which is how the design is reviewed.

const SKY_REPAINT_MS = 500
const FPS_CAP = 30
const MIN_FRAME_MS = 1000 / FPS_CAP
const MAX_DPR = 2
const MOBILE_MAX_DPR = 1.5
const IMMERSIVE_DAY_MINUTES = 7
const IMMERSIVE_RAMP_MS = 10_000

/** "HH:MM" -> hours (0-24), or null when the value is not a clock time. */
const parseClock = (value: string | null | undefined): number | null => {
  if (!value) return null
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  if (hour > 23 || minute > 59) return null
  return hour + minute / 60
}

export const SkyboxCanvas = ({
  timeOverride,
  config,
}: {
  /** Pins the sky to a time of day ("HH:MM"), e.g. for reviewing the design. */
  timeOverride?: string | null
  /** Overrides on top of SKYBOX_DEFAULTS, e.g. to try values out. */
  config?: Partial<SkyboxConfig>
}) => {
  const skyRef = useRef<HTMLCanvasElement>(null)
  const fxRef = useRef<HTMLCanvasElement>(null)
  const isMobile = useSyncExternalStore(
    subscribeToMobile,
    getIsMobile,
    getIsMobileOnServer
  )
  const immersive = useImmersive()

  useEffect(() => {
    const skyCanvas = skyRef.current
    const fxCanvas = fxRef.current
    const skyCtx = skyCanvas?.getContext('2d')
    const fx = fxCanvas?.getContext('2d')
    if (!skyCanvas || !skyCtx || !fxCanvas || !fx) return

    const cfg: SkyboxConfig = { ...SKYBOX_DEFAULTS, ...config }
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const params = new URLSearchParams(window.location.search)

    // A pinned time wins over the visitor's clock; a speed sweeps the day.
    const pinned = parseClock(timeOverride ?? params.get(SKY_TIME_PARAM))
    const speedParam = Number(params.get(SKY_SPEED_PARAM))
    const speed =
      Number.isFinite(speedParam) && speedParam > 0
        ? speedParam
        : Math.max(0.01, cfg.timeSpeed)

    const baseHours =
      pinned ??
      (() => {
        const now = new Date()
        return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600
      })()

    let toRGB = createColorResolver()
    let stars: Array<SkyStar> = []
    let clouds: Array<SkyCloud> = []
    let w = 0
    let h = 0
    let dpr = 1
    let clock = 0
    let lastSkyPaint = Number.NEGATIVE_INFINITY
    let lastStoreUpdate = Number.NEGATIVE_INFINITY

    const immersiveSpeed = (24 * 60) / IMMERSIVE_DAY_MINUTES
    const hoursAt = (elapsedMs: number) => {
      let progressedHours = (elapsedMs / 3_600_000) * speed
      if (immersive) {
        const rampElapsed = Math.min(elapsedMs, IMMERSIVE_RAMP_MS)
        const rampProgress = rampElapsed / IMMERSIVE_RAMP_MS
        const easedRampIntegral = rampProgress ** 3 - 0.5 * rampProgress ** 4
        const rampHours =
          (speed * rampElapsed +
            (immersiveSpeed - speed) * IMMERSIVE_RAMP_MS * easedRampIntegral) /
          3_600_000
        const afterRampHours =
          (Math.max(0, elapsedMs - IMMERSIVE_RAMP_MS) * immersiveSpeed) /
          3_600_000
        progressedHours = rampHours + afterRampHours
      }
      return (((baseHours + progressedHours) % 24) + 24) % 24
    }

    const build = () => {
      stars = buildStars(
        scaleForMobile(cfg.starCount, cfg, isMobile),
        cfg.sunriseHour * 1000 + 7
      )
      clouds = buildClouds(
        scaleForMobile(cfg.cloudCount, cfg, isMobile),
        cfg.sunsetHour * 1000 + 13
      )
    }

    const layout = () => {
      w = window.innerWidth
      h = window.innerHeight
      dpr = Math.min(
        window.devicePixelRatio || 1,
        isMobile ? MOBILE_MAX_DPR : MAX_DPR
      )
      for (const [canvas, ctx] of [
        [skyCanvas, skyCtx],
        [fxCanvas, fx],
      ] as const) {
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      paintSkyLayer(0)
    }

    const paintSkyLayer = (elapsed: number) => {
      const state = getSkyState(hoursAt(elapsed), cfg, toRGB)
      paintSky(skyCtx, w, h, state, clock)
      return state
    }

    const drawEffects = (elapsed: number) => {
      const state = getSkyState(hoursAt(elapsed), cfg, toRGB)
      fx.setTransform(dpr, 0, 0, dpr, 0, 0)
      fx.clearRect(0, 0, w, h)
      paintStars(fx, w, h, stars, state, clock)
      paintClouds(fx, w, h, clouds, state, clock)
      return state
    }

    build()
    layout()
    setSkyState(getSkyState(baseHours, cfg, toRGB))

    // Re-resolve the colors when the theme changes or the OS color scheme changes.
    const onThemeChange = () => {
      toRGB = createColorResolver()
      lastSkyPaint = Number.NEGATIVE_INFINITY
      if (reducedMotion) {
        paintSkyLayer(0)
        drawEffects(0)
      }
    }
    const themeObserver = new MutationObserver(onThemeChange)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)')
    colorScheme.addEventListener('change', onThemeChange)

    const onResize = () => {
      // The canvas fills the viewport, so its backing dimensions must track even
      // small viewport changes to keep the sun and moon circular.
      if (window.innerWidth === w && window.innerHeight === h) return
      layout()
      if (reducedMotion) drawEffects(0)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    if (reducedMotion) {
      // One still frame: the sky, and the stars at their full-night alpha.
      paintSkyLayer(0)
      drawEffects(0)
    } else {
      const start = performance.now()
      let last = start
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame)
        const elapsed = now - start
        const delta = now - last
        if (delta < MIN_FRAME_MS) return // low frame cap: the sky is slow
        last = now
        clock += delta

        const skyRepaintInterval = immersive ? MIN_FRAME_MS : SKY_REPAINT_MS
        if (now - lastSkyPaint >= skyRepaintInterval) {
          lastSkyPaint = now
          paintSkyLayer(elapsed)
        }
        const state = drawEffects(elapsed)

        // Other canvases read the sky, at most once a second.
        if (now - lastStoreUpdate > 1000) {
          lastStoreUpdate = now
          setSkyState(state)
        }
      }
      raf = requestAnimationFrame(frame)
    }

    return () => {
      window.removeEventListener('resize', onResize)
      colorScheme.removeEventListener('change', onThemeChange)
      themeObserver.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [timeOverride, config, isMobile, immersive])

  return (
    <>
      <canvas
        ref={skyRef}
        aria-hidden
        className='pointer-events-none fixed inset-0 z-[-1] h-full w-full'
      />
      <canvas
        ref={fxRef}
        aria-hidden
        className='pointer-events-none fixed inset-0 z-[-1] h-full w-full'
      />
    </>
  )
}
