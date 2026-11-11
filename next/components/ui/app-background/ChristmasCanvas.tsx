'use client'

import type {
  ChristmasBounds,
  ChristmasCanvasConfig,
  ChristmasCanvasSanityData,
  ChristmasChimney,
  ChristmasColors,
  ChristmasGlowGroup,
  ChristmasScene,
  ReindeerMotion,
  SantaFlight,
  SnowFlake,
} from '@shared/types/christmas-canvas.types'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import {
  buildRadialSprite,
  buildSleighSprite,
  clamp,
  lerp,
  paintChristmasScene,
  paintReindeer,
  REINDEER_COUNT,
  reindeerX,
  reindeerY,
  resolveChristmasColors,
  rgba,
  SLEIGH_HAND,
  SLEIGH_PART_WIDTH,
  SLEIGH_SIZE,
  withChristmasDefaults,
} from '@/lib/app-background/christmas-canvas'
import {
  getImmersive,
  setImmersive,
} from '@/lib/app-background/immersive-store'
import {
  getIsMobile,
  getIsMobileOnServer,
  subscribeToMobile,
  TAU,
} from '@/lib/star-canvas'

// Procedurally drawn Christmas scenery: flat, layered vector hills, striped pines,
// snow-capped mountains and a snowy village (some of it with Christmas lights), with
// Santa's sleigh flying by now and then. There is no sky: the canvases are transparent
// above the mountains, so a shared skybox can sit behind them later.
//
// Two canvases keep the per-frame work small:
//  - the scene canvas holds the still scenery (lib/app-background/christmas-canvas.ts),
//    painted once and again only when the screen size or the theme changes;
//  - the effects canvas is cleared and redrawn every frame with the cheap moving
//    parts: snow, chimney smoke, window glow, twinkling lights and the sleigh.
// Colors come from the theme variables (colors.module.css), like StarCanvas, so the
// scenery switches between its light and dark versions with the theme.

const MS_PER_FRAME = 16.667
const SNOW_AREA_PER_FLAKE = 12000 // px² of screen per flake at density 1
const SNOW_MOBILE_SHARE = 0.55
const SMOKE_PUFFS = 3
const SMOKE_RATE = 0.00011 // cycles per ms (one puff cycle takes about 9 s)
const SPARKLE_COUNT = 32
const SPARKLE_EVERY_MS = 45
const SPARKLE_LIFE_MS = 1000
const NOSE_FLASH_RATE = 0.008 // radians per ms: Rudolph's nose pulses about every 0.8 s
// One flight, or two flights if all four clicks land within six seconds.
const DEER_WINDOW_MS = 6000
const DEER_HIT_RADIUS = 24
const SKIP_CLICK =
  'a, button, input, textarea, select, [role="button"], [role="link"]'
const ignoreFullscreenError = () => undefined

// Three depths of snow, far to near: nearer flakes are bigger, brighter and faster.
// `radius` is the length of each arm of the snowflake, `line` its stroke width.
const SNOW_LAYERS = [
  { share: 0.5, radius: 1.8, line: 0.8, alpha: 0.6, speed: 0.45 },
  { share: 0.35, radius: 2.8, line: 1.1, alpha: 0.8, speed: 0.8 },
  { share: 0.15, radius: 4.2, line: 1.5, alpha: 0.95, speed: 1.3 },
] as const

export const ChristmasCanvas = ({
  sanityData,
  config,
}: {
  /** The `christmasCanvas` document from Sanity (settings and picked colors). */
  sanityData?: ChristmasCanvasSanityData | null
  /** Overrides on top of the Sanity settings, e.g. to try values out while designing. */
  config?: Partial<ChristmasCanvasConfig>
}) => {
  const sceneRef = useRef<HTMLCanvasElement>(null)
  const effectsRef = useRef<HTMLCanvasElement>(null)
  const isMobile = useSyncExternalStore(
    subscribeToMobile,
    getIsMobile,
    getIsMobileOnServer
  )

  useEffect(() => {
    const sceneCanvas = sceneRef.current
    const effectsCanvas = effectsRef.current
    const sceneCtx = sceneCanvas?.getContext('2d')
    const fx = effectsCanvas?.getContext('2d')
    if (!sceneCanvas || !sceneCtx || !effectsCanvas || !fx) return

    const cfg: ChristmasCanvasConfig = {
      ...withChristmasDefaults(sanityData),
      ...config,
    }
    const colorSettings = {
      light: sanityData?.lightColors,
      dark: sanityData?.darkColors,
    }
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    // Santa does not fly with reduced motion, so the reindeer hit areas stay empty.

    let colors: ChristmasColors = resolveChristmasColors(colorSettings)
    let scene: ChristmasScene | null = null
    let w = 0
    let h = 0
    let dpr = 1
    let layoutPending = false
    let clock = 0 // ms of animation time (stops while the tab is hidden)

    // ── Sprites (rebuilt on theme change) ─────────────────────────────────────────────
    let windowGlow: HTMLCanvasElement | null = null
    let smoke: HTMLCanvasElement | null = null
    let noseGlow: HTMLCanvasElement | null = null
    let lightGlows: Array<HTMLCanvasElement> = []
    let sleighSprite: HTMLCanvasElement | null = null
    let sleighWidth = 0 // on-screen size of the whole sleigh team
    let sleighHeight = 0
    // Scratch canvas for glows that have scenery in front of them (see drawGlows)
    const glowCanvas = document.createElement('canvas')
    const glowCtx = glowCanvas.getContext('2d')

    const buildSprites = () => {
      windowGlow = buildRadialSprite(64, colors.house.window, 0.8, 2)
      smoke = buildRadialSprite(64, colors.smoke, 0.7, 1.5)
      noseGlow = buildRadialSprite(64, colors.santa.nose, 0.9, 1.6)
      lightGlows = colors.lights.map((rgb) =>
        buildRadialSprite(32, rgb, 0.9, 1.8)
      )
    }

    const buildSleigh = () => {
      sleighWidth = clamp(w * 0.17, 150, 380)
      const scale = sleighWidth / SLEIGH_SIZE.width
      sleighHeight = SLEIGH_SIZE.height * scale
      sleighSprite = buildSleighSprite(colors, scale * dpr)
    }

    // ── Snow ────────────────────────────────────────────────────────────────────────
    const snow = SNOW_LAYERS.map((spec) => ({
      spec,
      flakes: [] as Array<SnowFlake>,
    }))

    const newFlake = (): SnowFlake => ({
      x: Math.random() * w,
      y: Math.random() * h,
      speed: 0.8 + Math.random() * 0.4,
      sway: 0.6 + Math.random() * 0.8,
      phase: Math.random() * TAU,
      angle: Math.random() * TAU,
      spin: (Math.random() - 0.5) * 0.03,
    })

    // Keeps the flakes already falling and only adds or removes the difference
    const fitSnow = () => {
      const total = cfg.enableSnow
        ? clamp((w * h) / SNOW_AREA_PER_FLAKE, 50, 220) *
          cfg.snowDensity *
          (isMobile ? SNOW_MOBILE_SHARE : 1)
        : 0
      for (const layer of snow) {
        const want = Math.round(total * layer.spec.share)
        while (layer.flakes.length < want) layer.flakes.push(newFlake())
        layer.flakes.length = want
      }
    }

    // ── Santa ─────────────────────────────────────────────────────────────────────────
    const flight: SantaFlight = {
      active: false,
      dir: 1,
      t: 0,
      durationMs: 1,
      y0: 0,
      y1: 0,
      arch: 0,
      bob: 0,
    }
    // Every reindeer gets its own gallop speed and bobbing on each flight
    const deer: Array<ReindeerMotion> = Array.from(
      { length: REINDEER_COUNT },
      () => ({
        phase: 0,
        gallopRate: 0.012,
        bobPhase: 0,
        bobRate: 0.004,
        bobAmp: 2,
      })
    )
    let nextFlightAt = cfg.santaFirstDelaySeconds * 1000
    const deerHits: Array<{ x: number; y: number; r: number } | null> =
      Array.from({ length: REINDEER_COUNT }, () => null)
    const deerClickedAt: Array<number> = Array(REINDEER_COUNT).fill(0)
    let sparkleTimer = 0
    let sparkleHead = 0
    // Fixed pool of trail sparkles, reused so nothing is allocated while flying
    const sparkles = Array.from({ length: SPARKLE_COUNT }, () => ({
      x: 0,
      y: 0,
      life: 0,
      size: 1,
    }))

    const scheduleNextFlight = () => {
      const gap = lerp(
        cfg.santaMinGapSeconds,
        Math.max(cfg.santaMinGapSeconds, cfg.santaMaxGapSeconds),
        Math.random()
      )
      nextFlightAt = clock + gap * 1000
    }

    const startFlight = () => {
      const speed = clamp(w / 13, 90, 230) // px per second
      flight.active = true
      flight.dir = Math.random() < 0.5 ? 1 : -1
      flight.t = 0
      flight.durationMs = ((w + sleighWidth * 2) / speed) * 1000
      flight.bob = Math.random() * TAU
      flight.y0 = h * (0.1 + Math.random() * 0.2)
      flight.y1 = h * (0.1 + Math.random() * 0.2)
      flight.arch = h * (0.02 + Math.random() * 0.05)
      for (const motion of deer) {
        motion.phase = Math.random() * TAU
        motion.gallopRate = 0.011 + Math.random() * 0.004
        motion.bobPhase = Math.random() * TAU
        motion.bobRate = 0.0035 + Math.random() * 0.002
        motion.bobAmp = 1.5 + Math.random() * 2
      }
    }

    // ── Layout ─────────────────────────────────────────────────────────────────────────
    const paintScene = () => {
      scene = paintChristmasScene(sceneCtx, w, h, colors, cfg, isMobile)
    }

    // Resizing clears a canvas, so the scene is painted again in the same task
    // (no blank frame in between)
    const layout = () => {
      layoutPending = false
      dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2)
      const prevW = w
      const prevH = h
      w = window.innerWidth
      h = window.innerHeight
      for (const canvas of [sceneCanvas, effectsCanvas, glowCanvas]) {
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
      }
      sceneCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      fx.setTransform(dpr, 0, 0, dpr, 0, 0)
      glowCtx?.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (prevW && prevH) {
        for (const layer of snow) {
          for (const flake of layer.flakes) {
            flake.x *= w / prevW
            flake.y *= h / prevH
          }
        }
      }
      fitSnow()
      paintScene()
      buildSleigh()
    }

    // ── Drawing the moving parts ───────────────────────────────────────────
    // Glow of the lit windows and the twinkling Christmas lights of one house or
    // decorated tree (additive)
    const drawGroupGlow = (
      ctx: CanvasRenderingContext2D,
      group: ChristmasGlowGroup,
      now: number
    ) => {
      ctx.globalCompositeOperation = 'lighter'
      if (windowGlow && cfg.enableWindowGlow) {
        const base = colors.isDark ? 0.9 : 0.4
        for (const win of group.windows) {
          ctx.globalAlpha =
            base * (0.8 + 0.2 * Math.sin(now * win.rate + win.phase))
          ctx.drawImage(
            windowGlow,
            win.x - win.r,
            win.y - win.r,
            win.r * 2,
            win.r * 2
          )
        }
      }
      const lightBase = colors.isDark ? 0.9 : 0.55
      for (const bulb of group.lights) {
        const sprite = lightGlows[bulb.colorIndex]
        if (!sprite) continue
        ctx.globalAlpha =
          lightBase * (0.55 + 0.45 * Math.sin(now * bulb.rate + bulb.phase))
        ctx.drawImage(
          sprite,
          bulb.x - bulb.r,
          bulb.y - bulb.r,
          bulb.r * 2,
          bulb.r * 2
        )
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    // The effects canvas is drawn on top of the whole scene, so a glow or a puff of
    // smoke that has scenery in front of it (a house in front of a lit tree, a hill
    // ridge) would show through it. Those are drawn on the scratch canvas first, the
    // shapes in front are cut out of them, and only then are they added to the picture
    // (`blend` says how). Things with nothing in front are drawn straight on.
    const drawCovered = <
      T extends { bounds: ChristmasBounds; cover: Array<Path2D> },
    >(
      spot: T,
      blend: GlobalCompositeOperation,
      draw: (
        ctx: CanvasRenderingContext2D,
        spot: T,
        now: number,
        wind: number
      ) => void,
      now: number,
      wind: number
    ) => {
      if (spot.cover.length === 0 || !glowCtx) {
        draw(fx, spot, now, wind)
        return
      }
      const b = spot.bounds
      const x0 = Math.max(0, Math.floor(b.x))
      const y0 = Math.max(0, Math.floor(b.y))
      const x1 = Math.min(w, Math.ceil(b.x + b.w))
      const y1 = Math.min(h, Math.ceil(b.y + b.h))
      if (x1 <= x0 || y1 <= y0) return

      glowCtx.clearRect(x0, y0, x1 - x0, y1 - y0)
      draw(glowCtx, spot, now, wind)
      glowCtx.globalCompositeOperation = 'destination-out'
      glowCtx.fillStyle = '#000'
      for (const shape of spot.cover) glowCtx.fill(shape)
      glowCtx.globalCompositeOperation = 'source-over'

      fx.globalCompositeOperation = blend
      fx.drawImage(
        glowCanvas,
        x0 * dpr,
        y0 * dpr,
        (x1 - x0) * dpr,
        (y1 - y0) * dpr,
        x0,
        y0,
        x1 - x0,
        y1 - y0
      )
      fx.globalCompositeOperation = 'source-over'
    }

    const drawGlows = (now: number, current: ChristmasScene) => {
      for (const group of current.groups) {
        drawCovered(group, 'lighter', drawGroupGlow, now, 0)
      }
    }

    const drawChimneySmoke = (
      ctx: CanvasRenderingContext2D,
      chimney: ChristmasChimney,
      now: number,
      wind: number
    ) => {
      if (!smoke) return
      for (let k = 0; k < SMOKE_PUFFS; k++) {
        const age = (now * SMOKE_RATE + chimney.phase + k / SMOKE_PUFFS) % 1
        const size = (14 + age * 46) * chimney.scale
        const x =
          chimney.x +
          wind * age * 70 * chimney.scale +
          Math.sin(age * 6 + chimney.phase * TAU) * 5 * chimney.scale
        const y = chimney.y - age * 70 * chimney.scale
        ctx.globalAlpha = Math.sin(Math.PI * age) * (colors.isDark ? 0.5 : 0.4)
        ctx.drawImage(smoke, x - size / 2, y - size / 2, size, size)
      }
      ctx.globalAlpha = 1
    }

    const drawSmoke = (now: number, wind: number, current: ChristmasScene) => {
      if (!smoke || !cfg.enableSmoke) return
      for (const chimney of current.chimneys) {
        drawCovered(chimney, 'source-over', drawChimneySmoke, now, wind)
      }
    }

    const drawSanta = (ms: number) => {
      if (!sleighSprite) return
      if (!flight.active) {
        deerHits.fill(null)
        if (clock < nextFlightAt) return
        startFlight()
      }
      flight.t += ms / flight.durationMs
      if (flight.t >= 1) {
        flight.active = false
        deerHits.fill(null)
        scheduleNextFlight()
        return
      }

      const t = flight.t
      const span = w + sleighWidth * 2
      const x =
        flight.dir > 0 ? -sleighWidth + span * t : w + sleighWidth - span * t
      const y =
        lerp(flight.y0, flight.y1, t) -
        flight.arch * Math.sin(Math.PI * t) +
        Math.sin(clock * 0.004 + flight.bob) * 3
      // Follows the path a little (slope of the arc, softened)
      const slope =
        flight.y1 - flight.y0 - flight.arch * Math.PI * Math.cos(Math.PI * t)
      const angle = Math.atan2(flight.dir * slope, span) * 0.6

      // Trail of sparkles from the back of the sleigh
      sparkleTimer += ms
      while (sparkleTimer >= SPARKLE_EVERY_MS) {
        sparkleTimer -= SPARKLE_EVERY_MS
        const spark = sparkles[sparkleHead]
        sparkleHead = (sparkleHead + 1) % SPARKLE_COUNT
        if (!spark) continue
        spark.x =
          x - flight.dir * sleighWidth * 0.48 + (Math.random() - 0.5) * 10
        spark.y = y + sleighHeight * 0.15 + (Math.random() - 0.5) * 10
        spark.life = 1
        spark.size = 1.2 + Math.random() * 2
      }
      fx.fillStyle = rgba(colors.sparkle)
      for (const spark of sparkles) {
        if (spark.life <= 0) continue
        spark.life -= ms / SPARKLE_LIFE_MS
        spark.y += ms * 0.01
        fx.globalAlpha = Math.max(0, spark.life)
        fx.beginPath()
        fx.arc(spark.x, spark.y, spark.size * Math.max(0, spark.life), 0, TAU)
        fx.fill()
      }
      fx.globalAlpha = 1

      // The team is drawn in its own units (SLEIGH_SIZE), centered on the flight path
      const scale = sleighWidth / SLEIGH_SIZE.width
      fx.save()
      fx.translate(x, y)
      fx.rotate(angle)
      if (flight.dir < 0) fx.scale(-1, 1) // the team faces right
      fx.scale(scale, scale)
      fx.translate(-SLEIGH_SIZE.width / 2, -SLEIGH_SIZE.height / 2)

      // The sleigh bobs and tilts on its own, around its middle
      const sleighBob = Math.sin(clock * 0.0032 + flight.bob) * 1.8
      const sleighTilt = Math.sin(clock * 0.0027 + flight.bob * 1.7) * 0.035
      fx.save()
      fx.translate(55, 50 + sleighBob)
      fx.rotate(sleighTilt)
      fx.drawImage(
        sleighSprite,
        -55,
        -50,
        SLEIGH_PART_WIDTH,
        SLEIGH_SIZE.height
      )
      fx.restore()
      const handY =
        SLEIGH_HAND.y + sleighBob + (SLEIGH_HAND.x - 55) * sleighTilt

      const bobOf = (i: number) => {
        const motion = deer[i]
        return motion
          ? Math.sin(clock * motion.bobRate + motion.bobPhase) * motion.bobAmp
          : 0
      }

      // Reins from Santa's hand and the harness between the reindeer follow all the bobbing
      fx.strokeStyle = rgba(colors.santa.trim)
      fx.lineWidth = 1
      fx.beginPath()
      fx.moveTo(SLEIGH_HAND.x, handY)
      fx.lineTo(reindeerX(0) - 14, reindeerY(0) + bobOf(0) - 2)
      for (let i = 0; i < REINDEER_COUNT - 1; i++) {
        fx.moveTo(reindeerX(i) + 14, reindeerY(i) + bobOf(i) - 2)
        fx.lineTo(reindeerX(i + 1) - 14, reindeerY(i + 1) + bobOf(i + 1) - 2)
      }
      fx.stroke()

      // Each reindeer gallops, bobs and tilts on its own; the lead one's nose flashes
      const flash = 0.5 + 0.5 * Math.sin(clock * NOSE_FLASH_RATE)
      for (const [i, motion] of deer.entries()) {
        fx.save()
        fx.translate(reindeerX(i), reindeerY(i) + bobOf(i))
        fx.rotate(
          Math.sin(clock * motion.bobRate * 0.8 + motion.bobPhase + 1) * 0.04
        )
        paintReindeer(
          fx,
          0,
          0,
          clock * motion.gallopRate + motion.phase,
          colors.santa,
          i === REINDEER_COUNT - 1 ? flash : undefined,
          noseGlow
        )
        const m = fx.getTransform()
        deerHits[i] = {
          x: m.e / dpr,
          y: m.f / dpr,
          r: DEER_HIT_RADIUS * scale,
        }
        fx.restore()
      }
      fx.restore()
    }

    // Each flake is three crossed lines (a six-armed snowflake) that slowly turns
    const drawSnow = (now: number, dt: number, wind: number) => {
      if (!cfg.enableSnow) return
      fx.lineCap = 'round'
      fx.strokeStyle = rgba(colors.snowfall)
      for (const { spec, flakes } of snow) {
        const r = spec.radius
        fx.beginPath()
        for (const flake of flakes) {
          if (dt > 0) {
            flake.y += spec.speed * flake.speed * cfg.snowSpeed * dt
            flake.x +=
              (wind * (0.5 + spec.speed) +
                Math.sin(now * 0.0012 * flake.sway + flake.phase) * 0.25) *
              dt
            flake.angle += flake.spin * dt
            if (flake.y > h + 6) {
              flake.y = -6
              flake.x = Math.random() * w
            }
            if (flake.x > w + 6) flake.x = -6
            else if (flake.x < -6) flake.x = w + 6
          }
          // Arm 1 at the flake's angle, arms 2 and 3 turned by 60 and 120 degrees
          const c1 = Math.cos(flake.angle) * r
          const s1 = Math.sin(flake.angle) * r
          const c2 = c1 * 0.5 - s1 * 0.866
          const s2 = s1 * 0.5 + c1 * 0.866
          const c3 = -c1 * 0.5 - s1 * 0.866
          const s3 = -s1 * 0.5 + c1 * 0.866
          fx.moveTo(flake.x - c1, flake.y - s1)
          fx.lineTo(flake.x + c1, flake.y + s1)
          fx.moveTo(flake.x - c2, flake.y - s2)
          fx.lineTo(flake.x + c2, flake.y + s2)
          fx.moveTo(flake.x - c3, flake.y - s3)
          fx.lineTo(flake.x + c3, flake.y + s3)
        }
        fx.lineWidth = spec.line
        fx.globalAlpha = spec.alpha
        fx.stroke()
      }
      fx.globalAlpha = 1
    }

    // Back to front: glows, smoke, Santa, then the snow in front of it all.
    // `dt` is in frames at 60fps, so speeds match on 60/120/144Hz screens.
    const draw = (now: number, dt: number) => {
      if (!scene) return
      const ms = dt * MS_PER_FRAME
      clock += ms
      fx.setTransform(dpr, 0, 0, dpr, 0, 0)
      fx.globalAlpha = 1
      fx.globalCompositeOperation = 'source-over'
      fx.clearRect(0, 0, w, h)

      // One gentle gust that comes and goes, shared by the smoke and the snow
      const wind = Math.sin(now * 0.00021) * 0.35 + 0.15

      drawGlows(now, scene)
      drawSmoke(now, wind, scene)
      if (cfg.enableSanta && !reducedMotion) drawSanta(ms)
      drawSnow(now, dt, wind)
    }

    const leaveImmersive = () => {
      if (document.fullscreenElement)
        document.exitFullscreen().catch(ignoreFullscreenError)
      setImmersive(false)
    }

    const onDeerClick = (event: PointerEvent) => {
      if (getImmersive()) {
        leaveImmersive()
        return
      }
      if (event.target instanceof Element && event.target.closest(SKIP_CLICK))
        return

      const i = deerHits.findIndex(
        (hit) =>
          hit !== null &&
          Math.hypot(event.clientX - hit.x, event.clientY - hit.y) <= hit.r
      )
      if (i < 0) return

      const now = performance.now()
      const oldestClick = deerClickedAt.reduce(
        (oldest, clickedAt) =>
          clickedAt > 0 ? Math.min(oldest, clickedAt) : oldest,
        Number.POSITIVE_INFINITY
      )
      if (now - oldestClick > DEER_WINDOW_MS) {
        deerClickedAt.fill(0)
      }
      deerClickedAt[i] = now
      if (deerClickedAt.every((clickedAt) => clickedAt > 0)) {
        deerClickedAt.fill(0)
        setImmersive(true)
        if (document.fullscreenEnabled) {
          document.documentElement
            .requestFullscreen()
            .catch(ignoreFullscreenError)
        }
      }
    }

    const onImmersiveKey = (event: KeyboardEvent) => {
      if (!getImmersive()) return
      if (event.key === 'Escape') leaveImmersive()
      else if (event.key === 'Tab') event.preventDefault()
    }

    const onFullscreenChange = () => {
      if (getImmersive() && !document.fullscreenElement) setImmersive(false)
    }

    // ── Setup ─────────────────────────────────────────────────────────────────────────
    buildSprites()
    layout()

    const redrawIfStatic = () => {
      if (reducedMotion) draw(performance.now(), 0)
    }

    const onResize = () => {
      // A phone's URL bar showing or hiding changes the height a little: the picture
      // just stretches, repainting for it would only make the scene jump
      if (
        !getImmersive() &&
        window.innerWidth === w &&
        Math.abs(window.innerHeight - h) < h * 0.2
      ) {
        return
      }
      if (reducedMotion) {
        layout()
        redrawIfStatic()
      } else {
        layoutPending = true // handled at the start of the next frame
      }
    }

    // Re-resolve the colors when the theme changes (data-theme/class on <html>, or the
    // OS color scheme when no manual theme is set)
    const onThemeChange = () => {
      colors = resolveChristmasColors(colorSettings)
      buildSprites()
      paintScene()
      buildSleigh()
      redrawIfStatic()
    }
    const themeObserver = new MutationObserver(onThemeChange)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)')
    colorScheme.addEventListener('change', onThemeChange)
    window.addEventListener('resize', onResize)
    window.addEventListener('pointerdown', onDeerClick)
    window.addEventListener('keydown', onImmersiveKey)
    document.addEventListener('fullscreenchange', onFullscreenChange)

    let raf = 0
    if (reducedMotion) {
      draw(performance.now(), 0) // one still frame
    } else {
      let last = performance.now()
      const frame = (now: number) => {
        if (layoutPending) layout()
        const elapsed = (now - last) / MS_PER_FRAME
        // Capped, so a long pause (hidden tab) does not make everything jump
        const dt = Number.isFinite(elapsed)
          ? Math.min(Math.max(elapsed, 0), 3)
          : 0
        last = now
        draw(now, dt)
        raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)
    }

    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointerdown', onDeerClick)
      window.removeEventListener('keydown', onImmersiveKey)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      colorScheme.removeEventListener('change', onThemeChange)
      themeObserver.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [sanityData, config, isMobile])

  return (
    <>
      <canvas
        ref={sceneRef}
        aria-hidden
        className='pointer-events-none fixed inset-0 z-[-1] h-full w-full'
      />
      <canvas
        ref={effectsRef}
        aria-hidden
        className='pointer-events-none fixed inset-0 z-[-1] h-full w-full'
      />
    </>
  )
}
