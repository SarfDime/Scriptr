'use client'

import {
  SKY_SPEED_PARAM,
  SKY_TIME_PARAM,
  SKYBOX_DEFAULTS,
} from '@shared/config/skybox'
import type { SkyboxConfig, SkyboxSanityData } from '@shared/types/skybox.types'
import { getSkyState } from '@shared/utils/skybox-model'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useImmersive } from '@/lib/app-background/immersive-store'
import {
  createLensFlare,
  LENS_FLARE_GHOST_COUNT,
  type LensFlare,
} from '@/lib/app-background/lens-flare'
import {
  getIsMobile,
  getIsMobileOnServer,
  subscribeToMobile,
} from '@/lib/app-background/mobile-store'
import {
  buildClouds,
  buildStars,
  createSkyColorResolver,
  paintClouds,
  paintSky,
  paintStars,
  resolveSkyboxPalette,
  type SkyCloud,
  type SkyStar,
  scaleForMobile,
  withSkyboxDefaults,
} from '@/lib/app-background/skybox-canvas'
import { setSkyState } from '@/lib/app-background/skybox-store'

// The shared sky behind every other background canvas: a vertical gradient, a
// faceted sun or moon, stars that fade in with the dark, and a few drifting clouds.
// It is the source of truth for where the sun and the moon are; the Christmas canvas
// paints its mountains on SKY_ANCHORS so the sun rises and sets behind the ridge.
//
// Two canvases keep the per-frame work small:
//  - the sky canvas (gradient, sun, moon) is repainted twice a second — the sky
//    changes slowly, except in immersive mode where it follows the 30 fps effects;
//  - the effects canvas is drawn live: the stars and the clouds, at half that rate
//    unless immersive mode is on.
// Nothing pauses behind a full-screen surface: a dialog covers the page with a
// dimmer, not with an opaque layer, so a frozen frame would show through it — and a
// hidden tab already stops `requestAnimationFrame`, which is the case that mattered.
// The local time is only read inside the effect, so the server and the first client
// render agree. `?skyTime=HH:MM` pins the clock and `?skySpeed=1440` sweeps a day in
// a minute, which is how the design is reviewed.

const SKY_REPAINT_MS = 500
const FPS_CAP = 24
const MIN_FRAME_MS = 1000 / FPS_CAP
const EFFECTS_MIN_FRAME_MS = 1000 / (FPS_CAP / 2)
const MAX_DPR = 2
const MOBILE_MAX_DPR = 1.5

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
  sanityData,
  timeOverride,
  config,
}: {
  /** The `skybox` document from Sanity (settings and picked colors). */
  sanityData?: SkyboxSanityData | null
  /** Pins the sky to a time of day ("HH:MM"), e.g. for reviewing the design. */
  timeOverride?: string | null
  /** Overrides on top of the Sanity settings, e.g. to try values out. */
  config?: Partial<SkyboxConfig>
}) => {
  const isMobile = useSyncExternalStore(
    subscribeToMobile,
    getIsMobile,
    getIsMobileOnServer
  )
  const immersive = useImmersive()
  const flareEnabled =
    config?.immersiveFlare ??
    sanityData?.immersiveFlare ??
    SKYBOX_DEFAULTS.immersiveFlare
  const skyRef = useRef<HTMLCanvasElement>(null)
  const fxRef = useRef<HTMLCanvasElement>(null)
  // The lens-flare overlay exists only while immersive; the loop picks it up on the
  // frame it appears and drops it on the frame it leaves.
  const flareRef = useRef<HTMLCanvasElement>(null)
  // 0 = themed palette, 1 = the immersive one, eased over `immersiveFadeMs`.
  const paletteMixRef = useRef(0)
  // The loop reads immersive from here rather than re-running for it: rebuilding
  // the scene on a flip resets the sky underneath the palette crossfade.
  const immersiveRef = useRef(immersive)
  // Where the animation has got to and what hour of day it is showing. Refs, so a
  // re-run (a device-type flip, a new config) carries on from there instead of
  // snapping back to the hour it mounted at.
  const clockRef = useRef(0)
  const hoursRef = useRef<number | null>(null)
  // The clock value immersive mode started at, and the hour it was showing, both -1
  // while it is off: the speed ramp is measured from the flip, not from the mount, and
  // a pinned review time resumes at that hour.
  const immersiveSinceRef = useRef(-1)
  const immersiveEntryHoursRef = useRef(-1)
  const pinnedRef = useRef<string | null>(null)
  // Repaints the single still frame under `prefers-reduced-motion`, where there is
  // no loop to notice an immersive flip.
  const stillRepaintRef = useRef<(() => void) | null>(null)
  // Re-lays the canvases when immersive mode takes the header's band back.
  const relayoutRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    immersiveRef.current = immersive
  }, [immersive])

  useEffect(() => {
    const skyCanvas = skyRef.current
    const fxCanvas = fxRef.current
    const skyCtx = skyCanvas?.getContext('2d')
    const fx = fxCanvas?.getContext('2d')
    if (!skyCanvas || !skyCtx || !fxCanvas || !fx) return

    const cfg: SkyboxConfig = { ...withSkyboxDefaults(sanityData), ...config }
    const colorSettings = {
      light: sanityData?.lightColors,
      dark: sanityData?.darkColors,
    }
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

    // A new pinned time starts the day over; otherwise the sky keeps the hour it has
    // reached, and only a first run reads the wall clock.
    const pinnedKey = pinned === null ? null : String(pinned)
    if (pinned !== null && pinnedRef.current !== pinnedKey) {
      hoursRef.current = pinned
      clockRef.current = 0
      immersiveSinceRef.current = -1
    }
    pinnedRef.current = pinnedKey
    // The visitor's clock, used for the first frame and again when a sweep ends.
    const wallClockHours = () => {
      const now = new Date()
      return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600
    }
    let hours = hoursRef.current ?? wallClockHours()
    hoursRef.current = hours

    let toRGB = createSkyColorResolver()
    let palette = resolveSkyboxPalette(colorSettings, toRGB)
    let stars: Array<SkyStar> = []
    let clouds: Array<SkyCloud> = []
    let state = getSkyState(hours, cfg, toRGB, paletteMixRef.current, palette)
    let w = 0
    let h = 0
    let dpr = 1
    // Where canvas coordinates start on screen: the canvases begin below the header,
    // except in immersive mode, where they cover the whole viewport.
    let originX = 0
    let originY = 0
    let clock = clockRef.current
    let layoutPending = true
    let lastSkyPaint = Number.NEGATIVE_INFINITY
    let lastEffectsDraw = Number.NEGATIVE_INFINITY
    let lastStoreUpdate = Number.NEGATIVE_INFINITY
    // Lens flares: immersive only, never with reduced motion. Touch has no cursor,
    // so only a mouse or pen moves them.
    let flare: LensFlare | null = null
    let flareCanvas: HTMLCanvasElement | null = null
    let flareCtx: CanvasRenderingContext2D | null = null
    let flareDrawn = false

    const immersiveSpeed = (24 * 60) / Math.max(0.5, cfg.immersiveDayMinutes)
    const rampMs = Math.max(0, cfg.immersiveRampSeconds) * 1000
    // The crossfade between the themed palette and the immersive one.
    const paletteFadeMs = Math.max(1, cfg.immersiveFadeMs)

    // Eased, so the crossfade starts and ends gently.
    const originalMix = () => {
      const m = paletteMixRef.current
      return m * m * (3 - 2 * m)
    }
    const skyAt = () => getSkyState(hours, cfg, toRGB, originalMix(), palette)

    /** Advances the hour of day by one frame. Immersive mode eases the day-speed up
     * over `immersiveRampSeconds`, so the sweep starts gently instead of snapping. */
    const advanceHours = (delta: number) => {
      let speedNow = speed
      if (immersiveRef.current) {
        if (immersiveSinceRef.current < 0) {
          immersiveSinceRef.current = clock
          immersiveEntryHoursRef.current = hours
        }
        const rampProgress =
          rampMs > 0
            ? Math.min(1, (clock - immersiveSinceRef.current) / rampMs)
            : 1
        const ease = rampProgress * rampProgress * (3 - 2 * rampProgress)
        speedNow = speed + (immersiveSpeed - speed) * ease
      } else {
        // Full screen is a detour from the day: leaving it puts the sky back at the
        // visitor's clock, not at the hour the sweep reached. A pinned review time
        // resumes where the review had got to instead.
        if (immersiveSinceRef.current >= 0) {
          hours =
            pinned === null ? wallClockHours() : immersiveEntryHoursRef.current
          hoursRef.current = hours
        }
        immersiveSinceRef.current = -1
      }
      hours = (hours + (delta * speedNow) / 3_600_000) % 24
      hoursRef.current = hours
    }

    const build = () => {
      stars = buildStars(
        scaleForMobile(cfg.starCount, cfg, isMobile),
        cfg.sunriseHour * 1000 + 7,
        cfg.starSize
      )
      clouds = buildClouds(
        scaleForMobile(cfg.cloudCount, cfg, isMobile),
        cfg.sunsetHour * 1000 + 13,
        cfg.cloudSpeed
      )
    }

    const targets = () => {
      const list: Array<
        readonly [HTMLCanvasElement, CanvasRenderingContext2D]
      > = [
        [skyCanvas, skyCtx],
        [fxCanvas, fx],
      ]
      if (flareCanvas && flareCtx) list.push([flareCanvas, flareCtx])
      return list
    }

    const paintSkyLayer = () => {
      paintSky(skyCtx, w, h, skyAt(), clock)
    }

    const drawEffects = () => {
      const current = skyAt()
      fx.setTransform(dpr, 0, 0, dpr, 0, 0)
      fx.clearRect(0, 0, w, h)
      paintStars(fx, w, h, stars, current, clock)
      paintClouds(fx, w, h, clouds, current, clock)
      return current
    }

    // Creates or drops the flare to match the canvas the JSX mounted. Both surfaces
    // are the same size, so it is decided once per appearance, not per frame.
    const syncFlare = () => {
      const canvas = flareRef.current
      if (canvas === flareCanvas) return
      flareCanvas = canvas
      flare = null
      flareCtx = null
      flareDrawn = false
      layoutPending = true
      if (!canvas || reducedMotion || !immersiveRef.current) return
      if (!cfg.immersiveFlare) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      flareCtx = ctx
      flare = createLensFlare(
        scaleForMobile(LENS_FLARE_GHOST_COUNT, cfg, isMobile)
      )
    }

    const layout = () => {
      layoutPending = false
      const rect = skyCanvas.getBoundingClientRect()
      originX = rect.left
      originY = rect.top
      // The canvas, not the window, is the sky's viewport: it starts below the header
      // and covers everything in immersive mode.
      const nextW = skyCanvas.clientWidth
      const nextH = skyCanvas.clientHeight
      const nextDpr = Math.min(
        window.devicePixelRatio || 1,
        isMobile ? MOBILE_MAX_DPR : MAX_DPR
      )
      if (nextW !== w || nextH !== h || nextDpr !== dpr) {
        w = nextW
        h = nextH
        dpr = nextDpr
        for (const [canvas, ctx] of targets()) {
          canvas.width = Math.round(w * dpr)
          canvas.height = Math.round(h * dpr)
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
      }
      // Both layers are repainted from the hour the sky is already at, so a resize
      // or a flip never snaps it back to the hour it started from.
      state = drawEffects()
      paintSkyLayer()
    }

    const paintStillFrame = () => {
      if (!reducedMotion) return
      // No animation to carry a fade, so the palette just switches.
      paletteMixRef.current = immersiveRef.current ? 1 : 0
      state = drawEffects()
      paintSkyLayer()
    }
    stillRepaintRef.current = paintStillFrame
    relayoutRef.current = () => {
      layoutPending = true
      if (reducedMotion) layout()
    }

    build()
    syncFlare()
    layout()
    setSkyState(state)

    // Re-resolve the colors when the theme changes or the OS color scheme changes.
    const onThemeChange = () => {
      toRGB = createSkyColorResolver()
      palette = resolveSkyboxPalette(colorSettings, toRGB)
      lastSkyPaint = Number.NEGATIVE_INFINITY
      paintStillFrame()
    }
    const themeObserver = new MutationObserver(onThemeChange)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)')
    colorScheme.addEventListener('change', onThemeChange)

    const onResize = () => {
      // Every size change re-lays the sky. Holding the bitmap and letting the box
      // stretch it would keep a small height change cheap, but the sun and the moon
      // are circles, and a stretched one reads as a bug.
      // Deferred to the next frame, so a drag-resize coalesces into one layout.
      if (reducedMotion) {
        layout()
      } else {
        layoutPending = true
      }
    }
    window.addEventListener('resize', onResize)
    // A canvas can be mounted without a size (a hidden tab, a window being
    // restored); window `resize` then never fires for the size it gets later.
    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(skyCanvas)

    const onPointerMove = (event: PointerEvent) => {
      if (!flare || event.pointerType === 'touch') return
      flare.setPointer(
        ((event.clientX - originX) / w) * 2 - 1,
        ((event.clientY - originY) / h) * 2 - 1
      )
    }
    window.addEventListener('pointermove', onPointerMove)

    let raf = 0
    if (reducedMotion) {
      // One still frame: the sky, and the stars at their full-night alpha.
      paintStillFrame()
    } else {
      let last = performance.now()
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame)
        const delta = now - last
        if (delta < MIN_FRAME_MS) return // low frame cap: the sky is slow
        last = now
        clock += delta
        clockRef.current = clock
        advanceHours(delta)

        syncFlare()
        if (layoutPending) layout()

        // Ease the palette toward the current mode; repaint every frame while it
        // moves, or the fade out of immersive would step at the slow repaint rate.
        const target = immersiveRef.current ? 1 : 0
        const mix = paletteMixRef.current
        const stepMix = delta / paletteFadeMs
        if (mix !== target) {
          paletteMixRef.current =
            mix < target
              ? Math.min(target, mix + stepMix)
              : Math.max(target, mix - stepMix)
        }
        const live = immersiveRef.current || paletteMixRef.current !== target

        const skyRepaintInterval = live ? MIN_FRAME_MS : SKY_REPAINT_MS
        if (now - lastSkyPaint >= skyRepaintInterval) {
          lastSkyPaint = now
          paintSkyLayer()
        }
        // Stars twinkle and clouds drift, so this layer is live, but at half the
        // frame cap outside immersive mode: neither needs 30 fps.
        if (
          now - lastEffectsDraw >=
          (live ? MIN_FRAME_MS : EFFECTS_MIN_FRAME_MS)
        ) {
          lastEffectsDraw = now
          state = drawEffects()
        }

        if (flare && flareCtx) {
          if (flareDrawn) flareCtx.clearRect(0, 0, w, h)
          flareDrawn = flare.paint(flareCtx, w, h, state, delta, clock)
        }
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
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      colorScheme.removeEventListener('change', onThemeChange)
      themeObserver.disconnect()
      stillRepaintRef.current = null
      relayoutRef.current = null
      cancelAnimationFrame(raf)
    }
  }, [sanityData, timeOverride, config, isMobile])

  // Under reduced motion there is no loop to notice the palette switch, so a flip
  // repaints the one still frame in the new palette. `immersive` is the trigger, not
  // a value this effect reads.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run on the flip is the point.
  useEffect(() => {
    relayoutRef.current?.()
    stillRepaintRef.current?.()
  }, [immersive])

  return (
    <>
      <canvas
        ref={skyRef}
        aria-hidden
        className='pointer-events-none fixed inset-x-0 top-(--header-height) z-[-1] h-(--background-height) w-full'
      />
      <canvas
        ref={fxRef}
        aria-hidden
        className='pointer-events-none fixed inset-x-0 top-(--header-height) z-[-1] h-(--background-height) w-full'
      />
      {immersive && flareEnabled && (
        <canvas
          ref={flareRef}
          data-lens-flare
          aria-hidden
          className='pointer-events-none fixed inset-x-0 top-(--header-height) z-[-1] h-(--background-height) w-full'
        />
      )}
    </>
  )
}
