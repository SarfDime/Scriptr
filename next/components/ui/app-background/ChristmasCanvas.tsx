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
import { TAU, WHITE } from '@/lib/app-background/canvas-primitives'
import {
  buildRadialSprite,
  buildSleighSprite,
  clamp,
  lerp,
  paintChristmasScene,
  paintPokeBurst,
  paintReindeer,
  REINDEER_COUNT,
  reindeerX,
  reindeerY,
  resolveChristmasColors,
  resolveImmersiveChristmasColors,
  rgba,
  SLEIGH_HAND,
  SLEIGH_PART_WIDTH,
  SLEIGH_SIZE,
  withChristmasDefaults,
} from '@/lib/app-background/christmas-canvas'
import {
  exitImmersive,
  getImmersive,
  setImmersive,
  useImmersive,
} from '@/lib/app-background/immersive-store'
import {
  getIsMobile,
  getIsMobileOnServer,
  subscribeToMobile,
} from '@/lib/app-background/mobile-store'
import { useUIStrings } from '@/providers/locale/use-strings'

// Procedurally drawn Christmas scenery: flat, layered vector hills, striped pines,
// snow-capped mountains and a snowy village (some of it with Christmas lights), with
// Santa's sleigh flying by now and then, calling out as it passes. There is no sky:
// the canvases are transparent above the mountains, so the shared skybox sits behind
// them.
//
// Three canvases keep the per-frame work small:
//  - the scene canvas holds the still scenery (lib/app-background/christmas-canvas.ts),
//    painted once and again only when the screen size or the theme changes;
//  - the immersive scene canvas holds the same scenery in the immersive palette, and is
//    only painted when that palette is actually shown; switching to it is a fade;
//  - the effects canvas is cleared and redrawn every frame with the cheap moving
//    parts: snow, chimney smoke, the twinkling lights of the decorated trees, the
//    sleigh and the sparkle bursts a clicked reindeer leaves behind.
//
// What keeps a frame cheap. Measure with `?canvasStats=1` before changing any of it:
//  - a glow or a puff of smoke with scenery in front of it is erased from the effects
//    canvas itself (`destination-out`) with a mask of those shapes, built once per
//    layout. Drawing it into a scratch canvas and copying it back cost several times
//    as much, and at DPR 2 it was most of the frame in Firefox;
//  - what holds still is pre-rendered: the radial sprites, the sleigh, and the speech
//    bubble, whose text is shaped once per size and palette instead of every frame
//    under a rotation (canvas text is the slowest thing Firefox draws);
//  - the sparkle trail fills in brightness steps rather than one path and one alpha
//    change per sparkle;
//  - the reindeer hit areas are worked out from the same transform chain as the draw,
//    not read back with `getTransform()`, which stalls an accelerated canvas;
//  - DPR is capped (2, 1.5 on a phone) and snow density follows the screen area;
//  - anything that changes only with the layout (masks, sprites, the bubble) is built
//    in `layout()`, never lazily on the frame that first needs it.
// Colors come from the theme variables (colors.module.css) and the colors picked in
// Sanity; both are dropped in immersive mode, which uses the theme-independent
// palette from christmas-colors.module.css.

const MS_PER_FRAME = 16.667
const SNOW_AREA_PER_FLAKE = 12000 // px² of screen per flake at density 1
const SNOW_MOBILE_SHARE = 0.55
const SMOKE_PUFFS = 3
const SMOKE_RATE = 0.00011 // cycles per ms (one puff cycle takes about 9 s)
const SPARKLE_COUNT = 32
const SPARKLE_EVERY_MS = 45
const SPARKLE_LIFE_MS = 1000
// The trail fades in this many brightness steps instead of one alpha per sparkle.
const SPARKLE_ALPHA_STEPS = 6
const NOSE_FLASH_RATE = 0.008 // radians per ms: Rudolph's nose pulses about every 0.8 s
// One flight, or two flights if all four clicks land within six seconds.
const DEER_WINDOW_MS = 6000
const DEER_HIT_RADIUS = 24
// How long a clicked reindeer hops, and the sparkle burst it answers with.
const POKE_MS = 650
const POKE_BURST_MS = 720
const POKE_BURST_SIZE = 26
// How long Santa calls out on each pass, as a share of the flight.
const CALL_FROM = 0.08
const CALL_TO = 0.5
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

/** How long the scenery takes to crossfade into its immersive colors, matching the sky. */
const PALETTE_FADE_MS = 1500

/** Smoothstep on a 0-1 value, for the fades that have to start and end gently. */
const smoothstep01 = (value: number) => {
  const t = clamp(value, 0, 1)
  return t * t * (3 - 2 * t)
}

/** A class's resolved font stack, for canvas text (a CSS variable is not usable there). */
const resolveFont = (className: string) => {
  const probe = document.createElement('span')
  probe.className = className
  document.body.appendChild(probe)
  const family = getComputedStyle(probe).fontFamily
  probe.remove()
  return family || 'sans-serif'
}

/** One palette and the sprites built from it: the theme's, or the immersive one. */
type ChristmasLook = {
  colors: ChristmasColors
  smoke: HTMLCanvasElement
  noseGlow: HTMLCanvasElement
  lightGlows: Array<HTMLCanvasElement>
  sleigh: HTMLCanvasElement | null
}

export const ChristmasCanvas = ({
  sanityData,
  config,
  immersiveEnabled = true,
  paletteFadeMs = PALETTE_FADE_MS,
}: {
  /** The `christmasCanvas` document from Sanity (settings and picked colors). */
  sanityData?: ChristmasCanvasSanityData | null
  /** Overrides on top of the Sanity settings, e.g. to try values out while designing. */
  config?: Partial<ChristmasCanvasConfig>
  /** Whether the four-reindeer click may enter full-screen mode (skybox setting). */
  immersiveEnabled?: boolean
  /** Crossfade into and out of the immersive palette (skybox setting). */
  paletteFadeMs?: number
}) => {
  const sceneRef = useRef<HTMLCanvasElement>(null)
  // The same scenery painted in the immersive palette, faded in over the themed one.
  const immersiveSceneRef = useRef<HTMLCanvasElement>(null)
  const effectsRef = useRef<HTMLCanvasElement>(null)
  const immersive = useImmersive()
  const ui = useUIStrings()
  const hoHoHo = ui.general.hoHoHo
  const isMobile = useSyncExternalStore(
    subscribeToMobile,
    getIsMobile,
    getIsMobileOnServer
  )

  useEffect(() => {
    const sceneCanvas = sceneRef.current
    const immersiveSceneCanvas = immersiveSceneRef.current
    const effectsCanvas = effectsRef.current
    const sceneCtx = sceneCanvas?.getContext('2d')
    const immersiveSceneCtx = immersiveSceneCanvas?.getContext('2d')
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

    // `?canvasStats=1` prints what each part of the frame costs, once a second. It is
    // the way to tell which layer is slow in the browser that is drawing it: Firefox
    // composites canvas layers much more slowly than Chromium, and a section that is
    // free there can dominate here.
    const stats =
      new URLSearchParams(window.location.search).get('canvasStats') === '1'
        ? {
            frames: 0,
            since: performance.now(),
            glows: 0,
            smoke: 0,
            santa: 0,
            snow: 0,
            total: 0,
          }
        : null

    let themedColors: ChristmasColors = resolveChristmasColors(colorSettings)
    let scene: ChristmasScene | null = null
    let w = 0
    let h = 0
    let dpr = 1
    // Where canvas coordinates start on screen: below the header, or at the top of
    // the viewport in immersive mode.
    let originX = 0
    let originY = 0
    let layoutPending = false
    let clock = 0 // ms of animation time (stops while the tab is hidden)

    // ── Palettes and sprites ──────────────────────────────────────────────────────────
    // Two palettes: the theme's (with the colors picked in Sanity on top) and the
    // immersive one, which ignores both. The scenery is painted twice as a result; the
    // immersive copy is a second scene canvas that fades in over the first, and the
    // sprites and the sleigh follow whichever palette is on.
    const buildLook = (palette: ChristmasColors): ChristmasLook => ({
      colors: palette,
      smoke: buildRadialSprite(64, palette.smoke, 0.7, 1.5),
      noseGlow: buildRadialSprite(64, palette.santa.nose, 0.9, 1.6),
      lightGlows: palette.lights.map((rgb) =>
        buildRadialSprite(32, rgb, 0.9, 1.8)
      ),
      sleigh: null,
    })

    let themedLook = buildLook(themedColors)
    const immersiveLook = buildLook(resolveImmersiveChristmasColors())
    const look = () => (getImmersive() ? immersiveLook : themedLook)
    // The immersive scene is only painted once it is actually shown, so a visitor who
    // never enters immersive mode pays nothing for it.
    let immersiveSceneDirty = true
    let sleighWidth = 0 // on-screen size of the whole sleigh team
    let sleighHeight = 0

    const buildSleigh = () => {
      sleighWidth = clamp(w * 0.17, 150, 380)
      const scale = sleighWidth / SLEIGH_SIZE.width
      sleighHeight = SLEIGH_SIZE.height * scale
      themedLook.sleigh = buildSleighSprite(themedLook.colors, scale * dpr)
      immersiveLook.sleigh = buildSleighSprite(
        immersiveLook.colors,
        scale * dpr
      )
      // Rendered here rather than the first time Santa calls out: that frame is
      // already the one that has to start the flight.
      callBubble = null
      buildCallBubble(clamp(sleighWidth * 0.055, 15, 26), themedLook.colors)
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
    // When each reindeer was last clicked, so it can answer with a hop
    const deerPokedAt: Array<number> = Array(REINDEER_COUNT).fill(
      Number.NEGATIVE_INFINITY
    )
    const pokeBursts: Array<{ x: number; y: number; at: number }> = []
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
    /** One small canvas per glow group and chimney holding just the shapes painted in
     * front of it, black on transparent. Cutting a glow with one `drawImage` costs a
     * fraction of filling every cover path on every frame, and at DPR 2 that alone was
     * about a third of the frame in Firefox. */
    type CoverSpot = { bounds: ChristmasBounds; cover: Array<Path2D> }
    const coverMasks = new Map<CoverSpot, HTMLCanvasElement>()

    const buildCoverMask = (spot: CoverSpot) => {
      if (spot.cover.length === 0) return
      const width = Math.ceil(spot.bounds.w * dpr)
      const height = Math.ceil(spot.bounds.h * dpr)
      if (width <= 0 || height <= 0) return
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        -spot.bounds.x * dpr,
        -spot.bounds.y * dpr
      )
      ctx.fillStyle = '#000'
      for (const shape of spot.cover) ctx.fill(shape)
      coverMasks.set(spot, canvas)
    }

    const paintScene = () => {
      scene = paintChristmasScene(sceneCtx, w, h, themedColors, cfg, isMobile)
      coverMasks.clear()
      for (const group of scene.groups) buildCoverMask(group)
      for (const chimney of scene.chimneys) buildCoverMask(chimney)
      immersiveSceneDirty = true
    }

    // The same scene in the immersive palette, painted into the canvas that fades in
    // over the themed one. Only ever painted while immersive is on.
    const paintImmersiveScene = () => {
      if (!immersiveSceneCtx) return
      paintChristmasScene(
        immersiveSceneCtx,
        w,
        h,
        immersiveLook.colors,
        cfg,
        isMobile
      )
      immersiveSceneDirty = false
    }

    // Resizing clears a canvas, so the scene is painted again in the same task
    // (no blank frame in between)
    const layout = () => {
      layoutPending = false
      const nextW = sceneCanvas.clientWidth
      const nextH = sceneCanvas.clientHeight
      // A canvas can be mounted before it is laid out (a hidden tab, a window
      // being restored), and it then measures 0×0. Painting that size divides by
      // a zero width in the scenery and throws on a non-finite gradient, so the
      // scene waits for the ResizeObserver below to report a real size.
      if (!(nextW > 0) || !(nextH > 0)) return
      dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2)
      const rect = sceneCanvas.getBoundingClientRect()
      originX = rect.left
      originY = rect.top
      // The canvas is the scene's viewport: it starts below the header, and covers
      // the whole screen in immersive mode.
      const prevW = w
      const prevH = h
      w = nextW
      h = nextH
      for (const canvas of [sceneCanvas, immersiveSceneCanvas, effectsCanvas]) {
        if (!canvas) continue
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
      }
      sceneCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      immersiveSceneCtx?.setTransform(dpr, 0, 0, dpr, 0, 0)
      fx.setTransform(dpr, 0, 0, dpr, 0, 0)

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
      // A resize clears the immersive copy too, and with reduced motion there is no
      // frame loop to paint it again.
      if (getImmersive()) paintImmersiveScene()
    }

    // ── Drawing the moving parts ───────────────────────────────────────────
    // The twinkling Christmas lights of one decorated tree (additive). The houses'
    // windows and bulbs are part of the scenery, with no glow of their own.
    const drawLightGlow = (
      ctx: CanvasRenderingContext2D,
      group: ChristmasGlowGroup,
      now: number
    ) => {
      const active = look()
      ctx.globalCompositeOperation = 'lighter'
      const lightBase = active.colors.isDark ? 0.9 : 0.55
      for (const bulb of group.lights) {
        const sprite = active.lightGlows[bulb.colorIndex]
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
    // ridge) would show through it. Cutting those shapes out of the effects canvas
    // itself is enough: it is transparent above the scenery, so erasing there hides the
    // glow and nothing else — and the cover is in front of every earlier spot too, so
    // erasing what they left in the same region is right. That replaced a scratch
    // canvas that was cleared, drawn into and copied back for every spot on every
    // frame, which was the most expensive part of the picture.
    const drawCovered = <
      T extends { bounds: ChristmasBounds; cover: Array<Path2D> },
    >(
      spot: T,
      draw: (
        ctx: CanvasRenderingContext2D,
        spot: T,
        now: number,
        wind: number
      ) => void,
      now: number,
      wind: number
    ) => {
      draw(fx, spot, now, wind)
      const mask = coverMasks.get(spot)
      if (!mask) return

      const b = spot.bounds
      const x0 = Math.max(0, Math.floor(b.x))
      const y0 = Math.max(0, Math.floor(b.y))
      const x1 = Math.min(w, Math.ceil(b.x + b.w))
      const y1 = Math.min(h, Math.ceil(b.y + b.h))
      if (x1 <= x0 || y1 <= y0) return

      const dx = Math.round(x0 * dpr)
      const dy = Math.round(y0 * dpr)
      const dw = Math.round((x1 - x0) * dpr)
      const dh = Math.round((y1 - y0) * dpr)
      fx.save()
      fx.setTransform(1, 0, 0, 1, 0, 0)
      fx.globalCompositeOperation = 'destination-out'
      fx.drawImage(
        mask,
        Math.round((x0 - b.x) * dpr),
        Math.round((y0 - b.y) * dpr),
        dw,
        dh,
        dx,
        dy,
        dw,
        dh
      )
      fx.restore()
    }

    const drawGlows = (now: number, current: ChristmasScene) => {
      for (const group of current.groups) {
        drawCovered(group, drawLightGlow, now, 0)
      }
    }

    const drawChimneySmoke = (
      ctx: CanvasRenderingContext2D,
      chimney: ChristmasChimney,
      now: number,
      wind: number
    ) => {
      const { smoke, colors } = look()
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
      if (!look().smoke || !cfg.enableSmoke) return
      for (const chimney of current.chimneys) {
        drawCovered(chimney, drawChimneySmoke, now, wind)
      }
    }

    // ── Santa's call ─────────────────────────────────────────────────────────────
    // A speech bubble over Santa's head while the team passes. It is drawn in screen
    // coordinates, outside the team's transform: the team is mirrored when it flies
    // right to left, which would flip the text.
    const bubbleFont = resolveFont('font-olive')
    let callBubble: CallBubble | null = null

    /** The bubble's box and its text, rendered once per size and palette. Shaping
     * and filling text under a rotated transform every frame is the slowest thing
     * canvas text does (Firefox rasterizes the glyph run again for each angle), and
     * the box is the same picture for the whole flight — only the tail moves. */
    type CallBubble = {
      key: string
      canvas: HTMLCanvasElement
      width: number
      height: number
      radius: number
    }

    const buildCallBubble = (
      size: number,
      colors: ChristmasColors
    ): CallBubble => {
      const key = `${size}|${dpr}|${colors.santa.body}`
      if (callBubble?.key === key) return callBubble

      const padX = size * 0.72
      const padY = size * 0.5
      const height = size + padY * 2
      const radius = height * 0.5
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      // Measured before the canvas is sized: assigning `width` resets the context,
      // font included.
      let textWidth = 0
      if (ctx) {
        ctx.font = `800 ${size}px ${bubbleFont}`
        textWidth = ctx.measureText(hoHoHo).width
      }
      const width = textWidth + padX * 2

      if (ctx) {
        canvas.width = Math.ceil(width * dpr)
        canvas.height = Math.ceil(height * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.beginPath()
        ctx.moveTo(radius, 0)
        ctx.lineTo(width - radius, 0)
        ctx.quadraticCurveTo(width, 0, width, radius)
        ctx.lineTo(width, height - radius)
        ctx.quadraticCurveTo(width, height, width - radius, height)
        ctx.lineTo(radius, height)
        ctx.quadraticCurveTo(0, height, 0, height - radius)
        ctx.lineTo(0, radius)
        ctx.quadraticCurveTo(0, 0, radius, 0)
        ctx.closePath()
        // Pure white rather than a palette color: a speech bubble is paper, not snow,
        // and it has to read the same over any sky.
        ctx.fillStyle = rgba(WHITE)
        ctx.fill()
        ctx.lineJoin = 'round'
        ctx.lineWidth = Math.max(2, size * 0.13)
        ctx.strokeStyle = rgba(colors.santa.body)
        ctx.stroke()

        ctx.font = `800 ${size}px ${bubbleFont}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = rgba(colors.santa.body)
        ctx.fillText(hoHoHo, width / 2, height / 2 + size * 0.04)
      }

      callBubble = { key, canvas, width, height, radius }
      return callBubble
    }

    const drawSantaCall = (t: number, headX: number, headY: number) => {
      const fade =
        smoothstep01((t - CALL_FROM) / 0.08) *
        (1 - smoothstep01((t - CALL_TO) / 0.08))
      if (fade <= 0.01) return

      const { colors } = look()
      const size = clamp(sleighWidth * 0.055, 15, 26)
      const bubble = buildCallBubble(size, colors)
      const { width: boxW, height: boxH, radius } = bubble
      const tail = size * 1.1
      const boxX = clamp(headX - boxW / 2, 8, Math.max(8, w - boxW - 8))
      const boxY = clamp(
        headY - boxH - tail * 0.7,
        8,
        Math.max(8, h - boxH - 8)
      )
      const tailBase = clamp(
        headX,
        boxX + radius * 0.9,
        boxX + boxW - radius * 0.9
      )

      const cx = boxX + boxW / 2
      const cy = boxY + boxH / 2
      fx.save()
      fx.globalAlpha = fade
      // A slow tilt keeps the bubble from looking stamped onto the picture.
      fx.translate(cx, cy)
      fx.rotate(Math.sin(clock * 0.0016) * 0.04)
      fx.translate(-cx, -cy)

      // The tail is the only part that changes: its base slides along the box so
      // the point stays on Santa's head. Its third edge is the box's own border.
      const tailLeft = tailBase - radius * 0.35
      const tailRight = tailBase + radius * 0.35
      fx.beginPath()
      fx.moveTo(tailRight, boxY + boxH)
      fx.lineTo(headX, headY)
      fx.lineTo(tailLeft, boxY + boxH)
      fx.closePath()
      fx.fillStyle = rgba(WHITE)
      fx.fill()
      fx.lineJoin = 'round'
      fx.lineWidth = Math.max(2, size * 0.13)
      fx.strokeStyle = rgba(colors.santa.body)
      fx.beginPath()
      fx.moveTo(tailRight, boxY + boxH)
      fx.lineTo(headX, headY)
      fx.lineTo(tailLeft, boxY + boxH)
      fx.stroke()

      // Last, so the box sits on the tail's seam.
      fx.drawImage(bubble.canvas, boxX, boxY, boxW, boxH)
      fx.restore()
    }

    const drawSanta = (ms: number) => {
      if (!look().sleigh) return
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
      for (const spark of sparkles) {
        if (spark.life <= 0) continue
        spark.life -= ms / SPARKLE_LIFE_MS
        spark.y += ms * 0.01
      }
      const active = look()
      const { colors } = active
      // One fill per brightness step rather than one per sparkle: every fill and
      // every alpha change is its own draw, and 32 of them per frame added up.
      fx.fillStyle = rgba(colors.sparkle)
      for (let step = SPARKLE_ALPHA_STEPS; step >= 1; step--) {
        const low = (step - 1) / SPARKLE_ALPHA_STEPS
        const high = step / SPARKLE_ALPHA_STEPS
        let drew = false
        fx.beginPath()
        for (const spark of sparkles) {
          if (spark.life <= low || spark.life > high) continue
          const r = spark.size * spark.life
          // A move before the arc, or the previous sparkle would be joined to it.
          fx.moveTo(spark.x + r, spark.y)
          fx.arc(spark.x, spark.y, r, 0, TAU)
          drew = true
        }
        if (!drew) continue
        fx.globalAlpha = (low + high) / 2
        fx.fill()
      }
      fx.globalAlpha = 1

      // The team is drawn in its own units (SLEIGH_SIZE), centered on the flight path
      const scale = sleighWidth / SLEIGH_SIZE.width
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
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
        active.sleigh as HTMLCanvasElement,
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
        // A click makes that deer hop, so the visitor can tell it is clickable
        const pokeAge = clock - (deerPokedAt[i] ?? Number.NEGATIVE_INFINITY)
        const poke = pokeAge >= 0 && pokeAge < POKE_MS ? pokeAge / POKE_MS : 0

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
          active.noseGlow,
          poke
        )
        // The deer's centre in screen space, by the same transform chain as the
        // head below — `getTransform()` would report it too, but only by reading the
        // context's matrix back, four times a frame.
        const localDeerX = (reindeerX(i) - SLEIGH_SIZE.width / 2) * scale
        const localDeerY =
          (reindeerY(i) + bobOf(i) - SLEIGH_SIZE.height / 2) * scale
        const mirroredDeerX = flight.dir < 0 ? -localDeerX : localDeerX
        deerHits[i] = {
          x: x + mirroredDeerX * cos - localDeerY * sin,
          y: y + mirroredDeerX * sin + localDeerY * cos,
          r: DEER_HIT_RADIUS * scale,
        }
        fx.restore()
      }
      fx.restore()

      // Santa's head in screen coordinates: the sprite's local (58, 14) put through
      // the same translate, mirror, scale and rotate as the team.
      const localX = (58 - SLEIGH_SIZE.width / 2) * scale
      const localY = (14 - SLEIGH_SIZE.height / 2) * scale
      const mirroredX = flight.dir < 0 ? -localX : localX
      const headX = x + mirroredX * Math.cos(angle) - localY * Math.sin(angle)
      const headY = y + mirroredX * Math.sin(angle) + localY * Math.cos(angle)
      drawSantaCall(t, headX, headY)
    }

    /** The flat sparkle bursts a clicked reindeer left behind, fading out. */
    const drawPokes = () => {
      if (pokeBursts.length === 0) return
      const rgb = look().colors.sparkle
      for (let i = pokeBursts.length - 1; i >= 0; i--) {
        const burst = pokeBursts[i]
        if (!burst) continue
        const t = (clock - burst.at) / POKE_BURST_MS
        if (t >= 1) {
          pokeBursts.splice(i, 1)
          continue
        }
        paintPokeBurst(fx, burst.x, burst.y, POKE_BURST_SIZE, t, rgb)
      }
    }

    // Each flake is three crossed lines (a six-armed snowflake) that slowly turns
    const drawSnow = (now: number, dt: number, wind: number) => {
      if (!cfg.enableSnow) return
      fx.lineCap = 'round'
      fx.strokeStyle = rgba(look().colors.snowfall)
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
      // Narrowed once: the timers below hand it to a closure.
      const painted = scene
      const frameStart = stats ? performance.now() : 0
      if (getImmersive() && immersiveSceneDirty) paintImmersiveScene()
      const ms = dt * MS_PER_FRAME
      clock += ms
      fx.setTransform(dpr, 0, 0, dpr, 0, 0)
      fx.globalAlpha = 1
      fx.globalCompositeOperation = 'source-over'
      fx.clearRect(0, 0, w, h)

      // One gentle gust that comes and goes, shared by the smoke and the snow
      const wind = Math.sin(now * 0.00021) * 0.35 + 0.15

      timed('glows', () => drawGlows(now, painted))
      timed('smoke', () => drawSmoke(now, wind, painted))
      if (cfg.enableSanta && !reducedMotion) timed('santa', () => drawSanta(ms))
      drawPokes()
      timed('snow', () => drawSnow(now, dt, wind))

      if (stats) {
        stats.frames += 1
        stats.total += performance.now() - frameStart
        reportStats()
      }
    }

    const onDeerClick = (event: PointerEvent) => {
      // A click on the scenery never leaves immersive mode (Escape, the fullscreen
      // exit and the exit button do). In full-screen a deer still hops and sparkles,
      // but the click is cosmetic: it must not ask for fullscreen again.
      if (event.target instanceof Element && event.target.closest(SKIP_CLICK))
        return

      const i = deerHits.findIndex(
        (hit) =>
          hit !== null &&
          Math.hypot(
            event.clientX - originX - hit.x,
            event.clientY - originY - hit.y
          ) <= hit.r
      )
      if (i < 0) return

      // The reaction: this deer hops and leaves a sparkle burst, so a visitor can tell
      // the reindeer are clickable before working out what clicking all four does.
      deerPokedAt[i] = clock
      const hit = deerHits[i]
      if (hit) pokeBursts.push({ x: hit.x, y: hit.y, at: clock })

      // Four clicks enter full-screen from the page only, and only when the skybox
      // setting allows it; inside it the click stays cosmetic.
      if (getImmersive() || !immersiveEnabled) return

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

    // A hand cursor over a reindeer is the quiet half of the affordance; the hop on
    // click is the loud half. Only the bare background counts, since a deer behind page
    // content cannot be clicked there either.
    let pointerCursor = false
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const target = event.target
      const onBackground =
        target === document.body ||
        target === document.documentElement ||
        target instanceof HTMLCanvasElement
      const overDeer =
        onBackground &&
        deerHits.some(
          (hit) =>
            hit !== null &&
            Math.hypot(
              event.clientX - originX - hit.x,
              event.clientY - originY - hit.y
            ) <= hit.r
        )
      if (overDeer === pointerCursor) return
      pointerCursor = overDeer
      document.body.style.cursor = overDeer ? 'pointer' : ''
    }

    const onImmersiveKey = (event: KeyboardEvent) => {
      if (!getImmersive()) return
      if (event.key === 'Escape') exitImmersive()
      else if (event.key === 'Tab') event.preventDefault()
    }

    const onFullscreenChange = () => {
      if (getImmersive() && !document.fullscreenElement) setImmersive(false)
    }

    // ── Setup ─────────────────────────────────────────────────────────────────────────
    layout()

    const redrawIfStatic = () => {
      if (reducedMotion) draw(performance.now(), 0)
    }

    /** Times one part of the frame when `?canvasStats=1` is on, and runs it plainly
     * otherwise, so the flag costs a branch rather than a measurement per frame. */
    const timed = (
      section: 'glows' | 'smoke' | 'santa' | 'snow',
      run: () => void
    ) => {
      if (!stats) {
        run()
        return
      }
      const start = performance.now()
      run()
      stats[section] += performance.now() - start
    }

    const reportStats = () => {
      if (!stats) return
      const now = performance.now()
      const elapsed = now - stats.since
      if (elapsed < 1000) return
      const frames = Math.max(1, stats.frames)
      // Last second's figures, also left on the window so a WebDriver run (where the
      // console cannot be read) can pick them up.
      const snapshot = {
        fps: Math.round((stats.frames * 1000) / elapsed),
        glows: +(stats.glows / frames).toFixed(2),
        smoke: +(stats.smoke / frames).toFixed(2),
        santa: +(stats.santa / frames).toFixed(2),
        snow: +(stats.snow / frames).toFixed(2),
        draw: +(stats.total / frames).toFixed(2),
        flight: flight.active ? +flight.t.toFixed(3) : null,
        w,
        h,
        dpr,
      }
      ;(window as Window & { canvasStats?: typeof snapshot }).canvasStats =
        snapshot
      // biome-ignore lint/suspicious/noConsole: only printed with ?canvasStats=1.
      console.info(
        `[canvas] ${snapshot.fps} fps · glows ${snapshot.glows} · smoke ${snapshot.smoke} · ` +
          `santa ${snapshot.santa} · snow ${snapshot.snow} · draw ${snapshot.draw} ms · ` +
          `${w}x${h} @${dpr}x` +
          (snapshot.flight === null ? '' : ` · flight ${snapshot.flight}`)
      )
      stats.frames = 0
      stats.since = now
      stats.glows = 0
      stats.smoke = 0
      stats.santa = 0
      stats.snow = 0
      stats.total = 0
    }

    const onResize = () => {
      // A phone's URL bar showing or hiding changes the height a little: the picture
      // just stretches, repainting for it would only make the scene jump
      if (
        !getImmersive() &&
        sceneCanvas.clientWidth === w &&
        Math.abs(sceneCanvas.clientHeight - h) < h * 0.2
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
      themedColors = resolveChristmasColors(colorSettings)
      themedLook = buildLook(themedColors)
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

    // The immersive copy has to be painted before its fade starts and the canvases
    // change size when the header's band is taken back, so both modes re-lay out.
    const onImmersiveClass = () => {
      if (reducedMotion) {
        layout()
        draw(performance.now(), 0)
        return
      }
      layoutPending = true
    }
    const immersiveObserver = new MutationObserver(onImmersiveClass)
    immersiveObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    window.addEventListener('resize', onResize)
    // Window `resize` does not fire when the canvas is first laid out after a
    // zero-size mount, and it misses size changes that do not resize the window.
    const resizeObserver = new ResizeObserver(() => {
      // No layout has succeeded yet, so there is no frame to protect: lay the
      // scene out now instead of waiting for a frame a hidden or idle tab may
      // not run.
      if (!w || !h) {
        layout()
        redrawIfStatic()
        return
      }
      onResize()
    })
    resizeObserver.observe(sceneCanvas)
    window.addEventListener('pointerdown', onDeerClick)
    window.addEventListener('pointermove', onPointerMove)
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
      resizeObserver.disconnect()
      window.removeEventListener('pointerdown', onDeerClick)
      window.removeEventListener('pointermove', onPointerMove)
      document.body.style.cursor = ''
      window.removeEventListener('keydown', onImmersiveKey)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      colorScheme.removeEventListener('change', onThemeChange)
      themeObserver.disconnect()
      immersiveObserver.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [sanityData, config, isMobile, hoHoHo, immersiveEnabled])

  return (
    <>
      <canvas
        ref={sceneRef}
        aria-hidden
        className='pointer-events-none fixed inset-x-0 top-(--header-height) z-[-1] h-(--background-height) w-full'
      />
      {/* The same scenery in the immersive palette. It is painted once, not per
          frame: switching palettes is only a fade, so the costly scene paint stays
          out of the animation. */}
      <canvas
        ref={immersiveSceneRef}
        aria-hidden
        className='pointer-events-none fixed inset-x-0 top-(--header-height) z-[-1] h-(--background-height) w-full transition-opacity ease-out motion-reduce:transition-none'
        style={{
          opacity: immersive ? 1 : 0,
          transitionDuration: `${paletteFadeMs}ms`,
        }}
      />
      <canvas
        ref={effectsRef}
        aria-hidden
        className='pointer-events-none fixed inset-x-0 top-(--header-height) z-[-1] h-(--background-height) w-full'
      />
    </>
  )
}
