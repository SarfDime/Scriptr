'use client'

import type {
  DriftingPlanet,
  Meteor,
  OrbitingPlanet,
  PlanetLook,
  Point,
  Star,
  StarCanvasConfig,
  StarCanvasSanityData,
} from '@shared/types/star-canvas.types'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import {
  AURORA_PRESETS,
  AURORA_WIDTH,
  addFalloff,
  BLACK_HOLE_PRESETS,
  BODY_RADIUS,
  buildGalaxySprites,
  buildHazeSprite,
  buildPlanetSprites,
  buildShadeSprite,
  buildSoftDot,
  GALAXY_DRIFT_DIRECTIONS,
  MOBILE_QUERY,
  makeAuroraCurtains,
  makeGalaxy,
  makePlanets,
  paintAurora,
  resolveColors,
  SPRITE_SIZE,
  scaleForMobile,
  TAU,
  TEXTURE_HEIGHT,
  TEXTURE_PERIOD,
  TEXTURE_VIEW,
  WHITE,
  withDefaults,
} from '@/lib/star-canvas'

export type { StarCanvasSanityData } from '@shared/types/star-canvas.types'

const EDGE_STEPS = 96 // segments used to draw the wobbly hole edge

// Layers of the rim flare, from the widest and faintest to the shortest and brightest:
// half-length (rad), line width (in hole radii) and opacity. Many thin steps blend
// into a smooth falloff instead of visible bands.
// Layers of the photon ring glow, from the widest and faintest to the thinnest and
// brightest: line width (in hole radii) and opacity
const RING_GLOW = [
  { width: 0.3, alpha: 0.06 },
  { width: 0.18, alpha: 0.1 },
  { width: 0.1, alpha: 0.18 },
  { width: 0.055, alpha: 0.32 },
] as const

const FLARE_ARCS = Array.from({ length: 12 }, (_, i) => {
  const t = i / 11
  return {
    span: 0.85 - 0.65 * t,
    width: 0.04 + 0.32 * (1 - t) ** 1.6,
    alpha: 0.04 + 0.6 * t ** 2,
  }
})

// The haze never changes, so the backdrop canvas is only painted when something invalidates
// it (first paint, resize, theme). The galaxy is a still picture on a canvas of its own, just
// big enough for itself: it is painted once (and again when the theme changes), and its drift
// and tilt are a CSS transform, done by the compositor. Even that is only rewritten once the
// drift adds up to this many px (about once a second at the defaults).
const GALAXY_MOVE_STEP = 0.25

// The easter egg: quick clicks on the black hole "ascend" the scene (see ascend() below)
const ASCEND_WINDOW_MS = 10000 // all the clicks must fall within this period (the oldest stop counting)
const ASCEND_HIT = 1.6 // clicks within this many hole radii of the center count
const ASCEND_VEIL = 1 // how much the page is covered behind the canvas (1 = hidden entirely)
const ASCEND_STARS = 140 // extra stars (fewer on phones)
const ASCEND_AURORA = 0.7 // the extra aurora's opacity at full ascension (kept dim)
const ASCEND_GALAXY_DRIFT = 0.02 // px per frame added to the galaxy's drift, so it moves even at 0
const ASCEND_GRAVITY_REACH = 0.6 // gravity reach at full ascension, as a share of the normal reach

// Only some stars twinkle, and slowly (radians per ms: roughly 7-21 s per cycle); the
// others keep a steady brightness (twinkle 0 leaves them at their random phase)
const TWINKLE_SHARE = 0.3
const TWINKLE_MIN = 0.0003
const TWINKLE_RANGE = 0.0009
const randomTwinkle = () =>
  Math.random() < TWINKLE_SHARE
    ? TWINKLE_MIN + Math.random() * TWINKLE_RANGE
    : 0
const ASCEND_Z = '2147483000' // on top of everything
// Clicks on these are meant for the page, so they never count
const INTERACTIVE =
  'a, button, input, textarea, select, label, summary, [role="button"], [role="link"], [contenteditable]'

const subscribeToMobile = (onChange: () => void) => {
  const query = window.matchMedia(MOBILE_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
const getIsMobile = () => window.matchMedia(MOBILE_QUERY).matches
const getIsMobileOnServer = () => false

export const CustomStarCanvas = ({
  sanityData,
}: {
  sanityData?: StarCanvasSanityData | null
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const backdropRef = useRef<HTMLCanvasElement>(null)
  const galaxyRef = useRef<HTMLCanvasElement>(null)
  const auroraRef = useRef<HTMLDivElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const isMobile = useSyncExternalStore(
    subscribeToMobile,
    getIsMobile,
    getIsMobileOnServer
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const backdrop = backdropRef.current
    const galaxyCanvas = galaxyRef.current
    const auroraEl = auroraRef.current
    const veil = veilRef.current
    const ctx = canvas?.getContext('2d')
    const backdropCtx = backdrop?.getContext('2d')
    const galaxyCtx = galaxyCanvas?.getContext('2d')
    if (
      !canvas ||
      !ctx ||
      !backdrop ||
      !backdropCtx ||
      !galaxyCanvas ||
      !galaxyCtx ||
      !auroraEl ||
      !veil
    ) {
      return
    }

    const cfg = isMobile
      ? scaleForMobile(withDefaults(sanityData))
      : withDefaults(sanityData)
    const motionScale = isMobile ? cfg.mobileScale : 1
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    let colors = resolveColors(cfg)

    const place = BLACK_HOLE_PRESETS[cfg.blackHolePresetPosition] ?? {
      x: cfg.blackHoleXRatio,
      y: cfg.blackHoleYRatio,
    }

    let w = 0
    let h = 0
    let bh: Point | null = null
    let glow: CanvasGradient | null = null
    let pointer: Point | null = null
    const stars: Array<Star> = []
    const meteors: Array<Meteor> = []
    const orbiting: Array<OrbitingPlanet> = []
    const drifting: Array<DriftingPlanet> = [] // both filled once the screen size is known
    const galaxy = makeGalaxy(cfg)
    const galaxyOffset: Point = { x: 0, y: 0 } // how far the galaxy has drifted, in px
    // The galaxy drifts in a direction you choose, at a share of the stars' speed
    // (the stars move diagonally, so the total speed is the same as theirs)
    const galaxyDirection = GALAXY_DRIFT_DIRECTIONS[cfg.galaxyDriftDirection] ??
      GALAXY_DRIFT_DIRECTIONS['up-left'] ?? { x: -1, y: -1 }
    // Positive tilt raises the right end (canvas angles run clockwise, so negate)
    const galaxyTilt = (-cfg.galaxyTilt * Math.PI) / 180
    const galaxySpeed = cfg.starDriftSpeed * cfg.galaxyDriftFactor * Math.SQRT2
    let backdropStale = true // haze needs painting (first paint, resize, theme)
    let galaxyStale = true // sprite rebuilt: repaint the galaxy canvas
    let galaxyPlaced = false // the CSS transform needs writing (first time, resize)
    let placedX = 0
    let placedY = 0
    // The galaxy canvas is the galaxy's sprite size (1 px per sprite px, no device pixel
    // ratio) and is shown at the galaxy's on-screen size
    const galaxyW = galaxy
      ? Math.max(1, Math.round(galaxy.width * galaxy.spriteScale))
      : 0
    const galaxyH = galaxy
      ? Math.max(1, Math.round(galaxy.height * galaxy.spriteScale))
      : 0
    if (galaxy) {
      galaxyCanvas.width = galaxyW
      galaxyCanvas.height = galaxyH
      galaxyCanvas.style.width = `${galaxy.width}px`
      galaxyCanvas.style.height = `${galaxy.height}px`
      galaxyCanvas.style.opacity = String(Math.min(1, cfg.galaxyOpacity))
    } else {
      galaxyCanvas.style.display = 'none'
    }

    // ── Aurora ──────────────────────────────────────────────────────────────
    // Each curtain is a canvas of its own, painted once (and again when the theme or the
    // window width changes a lot). After that it only moves through CSS animations on its
    // transform and opacity, which the compositor runs: no script and no repainting.
    // A set of curtains is made by a function, so the easter egg can add a second one
    // (its `cfg` is the config for that set)
    const makeAuroraSet = (parent: HTMLElement, cfg: StarCanvasConfig) => {
      const auroraCurtains = makeAuroraCurtains(cfg)
      const auroraY = AURORA_PRESETS[cfg.auroraPosition] ?? cfg.auroraYRatio
      const auroraAnimations: Array<Animation> = []
      const auroraCanvases = auroraCurtains.map((curtain) => {
        const el = document.createElement('canvas')
        Object.assign(el.style, {
          position: 'absolute',
          left: `${((1 - AURORA_WIDTH) / 2) * 100}%`,
          top: `${(auroraY - cfg.auroraHeight / 2) * 100}%`,
          width: `${AURORA_WIDTH * 100}%`,
          height: `${cfg.auroraHeight * 100}%`,
          transformOrigin: `50% ${curtain.baseline * 100}%`,
          willChange: 'transform, opacity',
          opacity: String(Math.min(1, curtain.weight * cfg.auroraIntensity)),
        })
        parent.appendChild(el)
        return el
      })
      let auroraBuiltWidth = 0 // screen width the curtains were painted for
      let auroraTimer = 0

      const paintAuroraNow = () => {
        window.clearTimeout(auroraTimer)
        if (!auroraCurtains.length || w <= 0 || h <= 0) return
        auroraBuiltWidth = w
        paintAurora(auroraCanvases, auroraCurtains, cfg, colors, w, h)
      }

      // Waits until a resize pauses, and ignores small changes: the curtains are soft, so
      // stretching them a little can't be seen (the URL bar showing on a phone, say)
      const scheduleAurora = () => {
        if (
          !auroraBuiltWidth ||
          Math.abs(w - auroraBuiltWidth) < auroraBuiltWidth * 0.25
        ) {
          return
        }
        window.clearTimeout(auroraTimer)
        auroraTimer = window.setTimeout(paintAuroraNow, 300)
      }

      // Every curtain sways from side to side while growing and shrinking a little, and
      // separately fades between dim and bright, each at its own pace
      const startAurora = () => {
        if (reducedMotion || cfg.auroraSpeed <= 0) return
        const loop = (duration: number, offset: number) => ({
          duration,
          delay: -duration * offset, // starts each curtain somewhere else in its cycle
          direction: 'alternate' as const,
          iterations: Number.POSITIVE_INFINITY,
          easing: 'ease-in-out',
          fill: 'both' as const,
        })
        auroraCurtains.forEach((curtain, i) => {
          const el = auroraCanvases[i]
          if (!el) return
          const sway = curtain.sway * 100
          const peak = Math.min(1, curtain.weight * cfg.auroraIntensity)
          auroraAnimations.push(
            el.animate(
              [
                {
                  transform: `translateX(${-sway}%) scaleY(${1 - curtain.breathe})`,
                },
                {
                  transform: `translateX(${sway}%) scaleY(${1 + curtain.breathe})`,
                },
              ],
              loop(curtain.swayMs / cfg.auroraSpeed, curtain.phase)
            ),
            el.animate(
              [{ opacity: peak * 0.5 }, { opacity: peak }],
              loop(curtain.fadeMs / cfg.auroraSpeed, (curtain.phase * 7) % 1)
            )
          )
        })
      }

      const setRate = (rate: number) => {
        for (const animation of auroraAnimations)
          animation.updatePlaybackRate(rate)
      }
      const dispose = () => {
        window.clearTimeout(auroraTimer)
        for (const animation of auroraAnimations) animation.cancel()
        for (const el of auroraCanvases) el.remove()
      }
      return {
        paint: paintAuroraNow,
        schedule: scheduleAurora,
        start: startAurora,
        setRate,
        dispose,
      }
    }
    const aurora = makeAuroraSet(auroraEl, cfg)

    // ── Black hole ascension (easter egg) ───────────────────────────────────
    // Quick clicks on the hole charge it up: the ring glows brighter, the flare spins
    // and the smoke churns more. At the last click the scene ascends: it moves above the
    // whole page (with the page hidden behind it), the browser goes fullscreen, and
    // everything eases into a busier, brighter version of itself. Pressing Esc (or
    // otherwise leaving fullscreen) eases it all back; clicking the hole does not, so
    // clicking on after the last click cannot throw you straight out. Only when the
    // browser refuses fullscreen (no Esc on touch screens) does a click on the hole leave.
    const ascensionEnabled =
      cfg.enableBlackHole && cfg.enableBlackHoleAscension && !reducedMotion
    let clicks = 0
    const clickTimes: Array<number> = [] // when the recent clicks on the hole happened
    let charge = 0 // 0 -> 1 as the clicks add up (stays 1 while ascended)
    let clickPulse = 0 // a flash on every click
    let blobAngle = 0 // axis of the squash, random on every click
    let holeSwell = 0 // extra radius of the hole: grows with each click, decays back to 0
    let holeGrow = 1 // radius of the hole relative to normal (1 + holeSwell)
    // Per frame at 60fps, so the swell is down to 10% after the configured seconds
    const swellDecay =
      0.1 ** (1 / (Math.max(0.1, cfg.blackHoleClickSettleSeconds) * 60))
    let ascended = false
    let ascension = 0 // eased 0 -> 1 while ascended, and back to 0 after
    // ascension and the charge-up scaled by the intensity setting: every boost in the
    // scene uses these, so the intensity dials the whole easter egg up or down
    let boost = 0
    let buildup = 0
    let inFullscreen = false
    let fullscreenFailed = false // refused or unavailable: Esc cannot be relied on
    let ascendedAt = 0
    let twinkleTime = 0 // ms, runs a little faster while ascended
    const extraStars = new Set<Star>()
    let bonusAurora: ReturnType<typeof makeAuroraSet> | null = null
    let bonusAuroraEl: HTMLDivElement | null = null
    const topLayers = [veil, backdrop, galaxyCanvas, auroraEl, canvas]

    // Fullscreen can be refused or unavailable (some browsers, some situations); the rest
    // of the ascension works without it, so that is not an error worth reporting
    const ignoreFullscreenError = () => {
      // nothing to do
    }

    const paintVeil = () => {
      veil.style.background = colors.core
    }

    // Back under the page right away; the extra effects keep easing out unseen
    const dropLayers = () => {
      for (const el of topLayers) el.style.zIndex = ''
    }

    const spawnExtraStars = () => {
      if (extraStars.size) return
      const range = Math.max(0, cfg.starMaxSize - cfg.starMinSize)
      const count = Math.round(
        ASCEND_STARS * motionScale * cfg.blackHoleAscensionIntensity
      )
      for (let i = 0; i < count; i++) {
        const star: Star = {
          x: Math.random() * w,
          y: Math.random() * h,
          size: cfg.starMinSize + Math.random() * range,
          colorIndex: Math.floor(Math.random() * cfg.starColors.length),
          twinkle: randomTwinkle(),
          phase: Math.random() * TAU,
          fade: 0, // fades in with the ascension
        }
        stars.push(star)
        extraStars.add(star)
      }
      stars.sort((a, b) => a.colorIndex - b.colorIndex)
    }

    // The extra aurora shows up even when the page has none switched on
    const spawnBonusAurora = () => {
      if (bonusAurora) return
      bonusAuroraEl = document.createElement('div')
      Object.assign(bonusAuroraEl.style, {
        position: 'absolute',
        inset: '0',
        opacity: '0',
      })
      auroraEl.appendChild(bonusAuroraEl)
      bonusAurora = makeAuroraSet(bonusAuroraEl, {
        ...cfg,
        enableAurora: true,
        auroraCurtains: Math.max(3, cfg.auroraCurtains),
        auroraIntensity: 0.5,
        auroraSpeed: cfg.auroraSpeed > 0 ? cfg.auroraSpeed : 1,
      })
      bonusAurora.paint()
      bonusAurora.start()
    }

    const ascend = () => {
      ascended = true
      ascendedAt = performance.now()
      clicks = 0
      clickTimes.length = 0
      for (const el of topLayers) el.style.zIndex = ASCEND_Z
      paintVeil()
      veil.style.visibility = ''
      veil.style.opacity = String(ASCEND_VEIL)
      veil.style.pointerEvents = 'auto' // the page underneath is out of reach
      if (cfg.blackHoleAscensionIntensity > 0) {
        spawnExtraStars()
        spawnBonusAurora()
      }
      fullscreenFailed = !document.fullscreenEnabled
      if (document.fullscreenEnabled) {
        document.documentElement
          .requestFullscreen()
          .then(() => {
            inFullscreen = !!document.fullscreenElement
          })
          .catch(() => {
            fullscreenFailed = true
          })
      }
    }

    const descend = () => {
      if (!ascended) return
      ascended = false
      clicks = 0
      clickTimes.length = 0
      dropLayers()
      // The veil has a slow fade; hide it at once so it cannot tint the page
      veil.style.visibility = 'hidden'
      veil.style.opacity = '0'
      veil.style.pointerEvents = 'none'
      if (inFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(ignoreFullscreenError)
      }
      inFullscreen = false
    }

    // Once everything has eased back, the extra stars are removed
    const leaveTop = () => {
      dropLayers()
      for (const star of extraStars) {
        const index = stars.indexOf(star)
        if (index >= 0) stars.splice(index, 1)
      }
      extraStars.clear()
      // The extra aurora is invisible by now: stop its animation and drop it
      bonusAurora?.dispose()
      bonusAuroraEl?.remove()
      bonusAurora = null
      bonusAuroraEl = null
    }

    // The parts of the ascension that are not redrawn every frame anyway
    const applyAscension = () => {
      const a = ascension
      const k = cfg.blackHoleAscensionIntensity
      if (galaxy) {
        galaxyCanvas.style.opacity = String(
          Math.min(1, cfg.galaxyOpacity * (1 + 0.5 * a * k))
        )
      }
      if (bonusAuroraEl)
        bonusAuroraEl.style.opacity = String(Math.min(1, a * ASCEND_AURORA * k))
      aurora.setRate(1 + 0.8 * a * k)
      bonusAurora?.setRate(1 + 0.8 * a * k)
      if (a === 0) leaveTop()
    }

    // Clicks older than the window stop counting, so slow starters are not punished
    const pruneClicks = (now: number) => {
      const cutoff = now - ASCEND_WINDOW_MS
      while (clickTimes.length && (clickTimes[0] ?? 0) < cutoff)
        clickTimes.shift()
      clicks = clickTimes.length
    }

    const updateAscension = (now: number, dt: number) => {
      if (!ascended && clickTimes.length) pruneClicks(now)
      const chargeTarget = ascended ? 1 : clicks / cfg.blackHoleAscensionClicks
      charge += (chargeTarget - charge) * 0.08 * dt
      // The swell from clicks always settles back to normal
      holeSwell *= swellDecay ** dt
      if (holeSwell < 0.001) holeSwell = 0
      holeGrow = 1 + holeSwell
      clickPulse = Math.max(0, clickPulse - 0.04 * dt)

      const target = ascended ? 1 : 0
      if (ascension !== target) {
        const next = ascension + (target - ascension) * 0.02 * dt
        ascension = Math.abs(target - next) < 0.002 ? target : next
        applyAscension()
      }
      boost = ascension * cfg.blackHoleAscensionIntensity
      // The charge-up glow builds with the clicks and hands over to the ascension
      buildup = charge * (1 - ascension) * cfg.blackHoleAscensionIntensity
    }

    const onClick = (e: MouseEvent) => {
      if (!bh) return
      if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return
      const distance = Math.hypot(e.clientX - bh.x, e.clientY - bh.y)
      if (distance > cfg.blackHoleRadius * holeGrow * ASCEND_HIT) return

      clickPulse = 1
      blobAngle = Math.random() * TAU
      holeSwell = Math.min(
        cfg.blackHoleClickSwellMax,
        holeSwell + cfg.blackHoleClickSwell
      )

      if (ascended) {
        // Leaving is Esc's job. A click shortly after the last one must not undo
        // the ascension, and only without fullscreen (touch screens) is a click
        // the way out.
        if (fullscreenFailed && performance.now() - ascendedAt > 800) descend()
        return
      }
      const now = performance.now()
      clickTimes.push(now)
      pruneClicks(now)
      if (clicks >= cfg.blackHoleAscensionClicks) ascend()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') descend()
    }
    const onFullscreenChange = () => {
      if (inFullscreen && !document.fullscreenElement) {
        inFullscreen = false
        descend()
      }
    }

    let shade: HTMLCanvasElement | null = null // shared day/night overlay for planets

    let puff: HTMLCanvasElement | null = null // soft blob sprite for the smoke
    let corona: CanvasGradient | null = null // second glow layer, just outside the ring
    let gradientRadius = 0 // hole radius the glow and corona gradients were built for
    let flare: HTMLCanvasElement | null = null // soft sprite for the bright spot on the rim
    let flareAngle = Math.random() * TAU // where on the rim the flare sits (spins on hover)
    let haze: HTMLCanvasElement | null = null // grayish circle behind everything
    let hazeTimer = 0
    let agitation = 0 // 0 (calm) to 1 (pointer close), eased
    let smokeTime = 0 // ms, runs faster while agitated
    let chaosTime = 0 // ms, drives the planets' hover chaos
    // Gravity grows with agitation (hover), so these are updated every frame
    let gravityRadius = cfg.blackHoleGravityRadius
    let gravityForce = cfg.blackHoleGravityForce
    const wispCount = Math.max(0, Math.round(cfg.blackHoleSmokeWisps))
    const wisps = Array.from({ length: wispCount }, (_, i) => ({
      phase: (i / wispCount) * TAU + Math.random(),
      rate: (0.0002 + Math.random() * 0.0003) * (i % 2 ? 1 : -1), // rad/ms
      orbit: 0.25 + Math.random() * 0.35,
      size: 0.6 + Math.random() * 0.5,
      alpha: 0.5 + Math.random() * 0.4,
    }))

    // ── Sprites (rebuilt on theme change) ───────────────────────────────────

    // The glow and corona start at the edge of the hole, so when the hole swells they
    // move out with it and keep their width (only their start moves)
    const buildHoleGradients = (inner: number) => {
      gradientRadius = inner
      const outer = Math.max(cfg.blackHoleGlowRadius, inner + 1)
      // Centered on (0, 0): drawBlackHole translates to the hole before filling
      const gradient = ctx.createRadialGradient(0, 0, inner, 0, 0, outer)
      addFalloff(gradient, colors.glow, 0.6, 2.2) // eased, so it ends without an edge
      glow = gradient

      // Corona: warm layer hugging the ring that melts into the base glow, like the
      // light around an eclipse. Brightest at the ring, gone at its outer edge.
      corona = null
      if (cfg.blackHoleCoronaWidth > 0) {
        const edge = inner + cfg.blackHoleRadius * cfg.blackHoleCoronaWidth
        const layer = ctx.createRadialGradient(0, 0, inner, 0, 0, edge)
        // Fades out slowly while its color turns into the glow color, so it
        // melts into the glow instead of ending as a separate ring
        addFalloff(layer, colors.corona, 1, 1.8, colors.glow)
        corona = layer
      }
    }

    const buildGlow = () => {
      if (!bh) {
        glow = null
        puff = null
        corona = null
        flare = null
        return
      }
      const sprite = document.createElement('canvas')
      sprite.width = 128
      sprite.height = 128
      const sctx = sprite.getContext('2d')
      if (sctx) {
        const g = sctx.createRadialGradient(64, 64, 0, 64, 64, 64)
        addFalloff(g, colors.glow, 0.55, 2)
        sctx.fillStyle = g
        sctx.fillRect(0, 0, 128, 128)
      }
      puff = sprite

      buildHoleGradients(cfg.blackHoleRadius * holeGrow)
      flare = cfg.enableBlackHoleFlare ? buildSoftDot(colors.flare) : null
    }

    // Soft grayish circle in the middle of the screen that fades to your normal
    // background at the edges, so everything on top is a bit easier to see. It is
    // dithered (see buildHazeSprite) so the fade has no visible rings.
    const buildHaze = () => {
      window.clearTimeout(hazeTimer)
      haze =
        cfg.enableBackgroundHaze &&
        cfg.backgroundHazeOpacity > 0 &&
        w > 0 &&
        h > 0
          ? buildHazeSprite(
              w,
              h,
              colors.haze,
              cfg.backgroundHazeOpacity,
              cfg.backgroundHazeRadius
            )
          : null
      backdropStale = true
    }

    // Painting the haze takes a few milliseconds, so while the window is being
    // resized it waits until the resizing pauses
    const scheduleHaze = () => {
      window.clearTimeout(hazeTimer)
      hazeTimer = window.setTimeout(() => {
        buildHaze()
        redrawIfStatic()
      }, 150)
    }

    const buildSprites = () => {
      shade = buildShadeSprite(colors.glow)
      const planets: Array<PlanetLook> = [...orbiting, ...drifting]
      for (const planet of planets) {
        const sprites = buildPlanetSprites(
          planet,
          colors.planets[planet.colorIndex] ?? WHITE
        )
        planet.texture = sprites.texture
        planet.ringBack = sprites.ringBack
        planet.ringFront = sprites.ringFront
      }
      if (galaxy) buildGalaxySprites(galaxy, colors)
      galaxyStale = true
    }

    // Sizes the canvas, keeps existing stars in place on resize, and rebuilds the
    // pieces that depend on screen size (hole position + glow gradient).
    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const prevW = w
      const prevH = h
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      backdrop.width = w * dpr // resizing clears it, so it has to be repainted
      backdrop.height = h * dpr
      backdropCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      backdropStale = true
      galaxyPlaced = false // its position depends on the screen size

      if (prevW && prevH) {
        const floating: Array<Point> = [...stars, ...drifting]
        for (const p of floating) {
          p.x *= w / prevW
          p.y *= h / prevH
        }
        galaxyOffset.x *= w / prevW
        galaxyOffset.y *= h / prevH
      }

      bh = cfg.enableBlackHole ? { x: w * place.x, y: h * place.y } : null
      buildGlow()
      scheduleHaze()
    }

    // ── Physics ─────────────────────────────────────────────────────────────

    // Pulls `p` toward the hole. Returns true once it crosses the event horizon.
    const attract = (p: Point, strength: number, dt: number) => {
      if (!bh) return false
      const dx = bh.x - p.x
      const dy = bh.y - p.y
      const dist = Math.hypot(dx, dy)
      if (dist < cfg.blackHoleRadius * holeGrow) return true
      if (dist < gravityRadius) {
        const pull = (1 - dist / gravityRadius) * gravityForce * strength * dt
        p.x += (dx / dist) * pull
        p.y += (dy / dist) * pull
      }
      return false
    }

    // Swallowed stars and planets come back somewhere random outside the gravity
    // reach. (Respawning on the screen edge made stars pile up there: edge stars
    // barely drift and gravity never reaches them.)
    const respawn = (s: Point & { fade: number }) => {
      for (let i = 0; i < 10; i++) {
        s.x = Math.random() * w
        s.y = Math.random() * h
        if (!bh || Math.hypot(s.x - bh.x, s.y - bh.y) > gravityRadius) break
      }
      s.fade = 0
    }

    // The pointer only agitates the hole (no following). The closer it is, the
    // faster and wider the smoke moves, the more the edge ripples, and the
    // stronger and farther-reaching the gravity gets (by the hover multipliers).
    const updateAgitation = (dt: number) => {
      let target = 0
      if (bh && pointer) {
        const dist = Math.hypot(pointer.x - bh.x, pointer.y - bh.y)
        const reach = Math.max(cfg.blackHoleGlowRadius, 1)
        if (dist < reach) {
          const t = 1 - dist / reach
          target = t * t * (3 - 2 * t) // smoothstep
        }
      }
      // Clicks agitate the hole just like the pointer does (briefly: the charge-up
      // itself must not keep the smoke and ripples widened while ascended)
      const lift = Math.max(target, clickPulse)
      agitation += (lift - agitation) * 0.04 * dt
      // The flare spins around the rim while hovered (about a turn per 10 seconds)
      flareAngle += dt * 16.667 * 0.0006 * cfg.blackHoleFlareSpin * agitation
      smokeTime +=
        dt *
        16.667 *
        (1 + 1.5 * agitation) *
        (1 + boost) *
        cfg.blackHoleSmokeSpeed
      // While ascended the reach shrinks to ASCEND_GRAVITY_REACH of normal, whatever
      // hover and clicks are doing
      const hoverReach = 1 + (cfg.blackHoleHoverReachMultiplier - 1) * agitation
      gravityRadius =
        cfg.blackHoleGravityRadius *
        (hoverReach + (ASCEND_GRAVITY_REACH - hoverReach) * Math.min(1, boost))
      gravityForce =
        cfg.blackHoleGravityForce *
        (1 + (cfg.blackHoleHoverGravityMultiplier - 1) * agitation)
    }

    const spin = (p: PlanetLook, elapsed: number, chaos: number) => {
      const turned = p.spinOffset + p.spinRate * elapsed * (1 + 3 * chaos)
      p.spinOffset =
        ((turned % TEXTURE_PERIOD) + TEXTURE_PERIOD) % TEXTURE_PERIOD
    }

    // Orbits and spin. While the pointer is over the hole, `chaos` makes every
    // planet speed up and slow down at its own rhythm, wobble in and out, and spin
    // faster. With no hover (or a chaos multiplier of 0) nothing changes.
    const updateOrbits = (dt: number) => {
      const elapsed = dt * 16.667 * (1 + boost)
      chaosTime += elapsed
      const chaos = cfg.planetHoverChaos * agitation

      for (const p of orbiting) {
        const rhythm = Math.sin(chaosTime * p.wobbleRate + p.wobblePhase)
        p.angle +=
          p.rate * elapsed * Math.max(0.1, 1 + chaos * (0.8 + 1.4 * rhythm))
        const wobble =
          1 +
          0.12 *
            chaos *
            Math.sin(chaosTime * p.wobbleRate * 0.7 + p.wobblePhase * 1.7)
        const dist = p.ratio * cfg.blackHoleRadius * wobble
        p.x = Math.cos(p.angle) * dist
        p.y = Math.sin(p.angle) * dist * cfg.planetOrbitTilt
        spin(p, elapsed, chaos)
      }
      for (const p of drifting) spin(p, elapsed, chaos)
    }

    // ── Drawing ─────────────────────────────────────────────────────────────

    // Drifts like the stars but more slowly (it is farther away), in the chosen direction.
    // The galaxy is a still picture on its own canvas, so drifting it is just a CSS
    // transform (the compositor moves it, nothing is repainted), and that is only written
    // once the drift adds up to GALAXY_MOVE_STEP px. `dt` is in frames; with reduced
    // motion it is 0, so the galaxy stays still.
    const drawGalaxy = (dt: number) => {
      if (!galaxy) return
      const speed = galaxySpeed * (1 + 5 * boost) + ASCEND_GALAXY_DRIFT * boost
      galaxyOffset.x += galaxyDirection.x * speed * dt
      galaxyOffset.y += galaxyDirection.y * speed * dt

      // Half the size of the box around the tilted band, to know when it has left
      const cos = Math.abs(Math.cos(galaxyTilt))
      const sin = Math.abs(Math.sin(galaxyTilt))
      const halfX = (galaxy.width * cos + galaxy.height * sin) / 2
      const halfY = (galaxy.width * sin + galaxy.height * cos) / 2

      // Once it has drifted completely off one side, bring it back in from the
      // opposite side
      const centerX = w * galaxy.anchor.x + galaxyOffset.x
      const centerY = h * galaxy.anchor.y + galaxyOffset.y
      if (centerX < -halfX) galaxyOffset.x += w + halfX * 2
      else if (centerX > w + halfX) galaxyOffset.x -= w + halfX * 2
      if (centerY < -halfY) galaxyOffset.y += h + halfY * 2
      else if (centerY > h + halfY) galaxyOffset.y -= h + halfY * 2

      const x = w * galaxy.anchor.x + galaxyOffset.x
      const y = h * galaxy.anchor.y + galaxyOffset.y
      if (
        !galaxyPlaced ||
        Math.hypot(x - placedX, y - placedY) >= GALAXY_MOVE_STEP
      ) {
        galaxyPlaced = true
        placedX = x
        placedY = y
        galaxyCanvas.style.transform = `translate(${x}px, ${y}px) rotate(${galaxyTilt}rad) translate(${-galaxy.width / 2}px, ${-galaxy.height / 2}px)`
        galaxyCanvas.style.display = 'block'
      }

      if (galaxyStale) paintGalaxy()
    }

    // Copies the flattened sprite onto the galaxy canvas, once, and again whenever the
    // sprite is rebuilt (theme change). The sprite is released afterwards: the canvas
    // keeps the picture, so only one copy stays in memory.
    const paintGalaxy = () => {
      if (!galaxy?.sprite) return
      galaxyStale = false
      galaxyCtx.clearRect(0, 0, galaxyW, galaxyH)
      galaxyCtx.drawImage(galaxy.sprite, 0, 0, galaxyW, galaxyH)
      galaxy.sprite = null
    }

    // The haze, on the backdrop canvas. It never moves, so it is only painted when it
    // changed.
    const drawBackdrop = () => {
      if (!backdropStale) return
      backdropStale = false

      backdropCtx.clearRect(0, 0, w, h)
      if (haze) {
        // The haze is stored at half resolution; scaling it up without smoothing
        // keeps its fine noise (see buildHazeSprite)
        backdropCtx.imageSmoothingEnabled = false
        backdropCtx.drawImage(haze, 0, 0, w, h)
        backdropCtx.imageSmoothingEnabled = true
      }
    }

    // `lightAngle`: direction the lit side faces
    const drawPlanet = (
      p: PlanetLook,
      x: number,
      y: number,
      lightAngle: number
    ) => {
      if (!p.texture) return
      const size = (SPRITE_SIZE * p.radius) / BODY_RADIUS
      if (p.ringBack) {
        ctx.drawImage(p.ringBack, x - size / 2, y - size / 2, size, size)
      }

      // Body: a window into the surface texture, scrolled by the spin, as a disc
      ctx.save()
      ctx.beginPath()
      ctx.arc(x, y, p.radius, 0, TAU)
      ctx.clip()
      ctx.drawImage(
        p.texture,
        p.spinOffset,
        0,
        TEXTURE_VIEW,
        TEXTURE_HEIGHT,
        x - p.radius,
        y - p.radius,
        p.radius * 2,
        p.radius * 2
      )
      ctx.restore()

      if (shade) {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(lightAngle)
        ctx.drawImage(shade, -size / 2, -size / 2, size, size)
        ctx.restore()
      }
      if (p.ringFront) {
        ctx.drawImage(p.ringFront, x - size / 2, y - size / 2, size, size)
      }
    }

    // Planets on the far half of their orbit (y < 0) go behind the hole, the rest
    // in front. Coordinates are relative to the hole (the caller has translated).
    const drawOrbiting = (front: boolean) => {
      for (const p of orbiting) {
        if (p.y >= 0 === front) drawPlanet(p, p.x, p.y, Math.atan2(-p.y, -p.x))
      }
    }

    // Free planets drift like stars, but heavier: gravity pulls them in more slowly
    const drawDrifting = (dt: number) => {
      for (const p of drifting) {
        if (attract(p, 0.6, dt)) respawn(p)
        p.fade = Math.min(1, p.fade + dt * 0.02)
        const speed = cfg.freePlanetDriftSpeed * (1 + 1.5 * boost)
        p.x -= speed * dt
        p.y -= speed * dt
        const margin = p.radius * 2
        if (p.x < -margin) p.x += w + margin * 2
        if (p.y < -margin) p.y += h + margin * 2

        // Lit by the black hole if there is one, otherwise from the top-left
        const lightAngle = bh
          ? Math.atan2(bh.y - p.y, bh.x - p.x)
          : -Math.PI * 0.75
        ctx.globalAlpha = p.fade
        drawPlanet(p, p.x, p.y, lightAngle)
      }
      ctx.globalAlpha = 1
    }

    const drawStars = (dt: number) => {
      // Stars are sorted by palette index, so fillStyle only changes a handful of times
      let fillIndex = -1
      const speed = cfg.starDriftSpeed * (1 + 1.5 * boost)
      twinkleTime += dt * 16.667 * (1 + 0.3 * boost)
      for (const s of stars) {
        if (attract(s, 1, dt)) respawn(s)
        // The extra stars can only be as visible as the ascension is
        s.fade = Math.min(extraStars.has(s) ? ascension : 1, s.fade + dt * 0.02)
        s.x -= speed * dt
        s.y -= speed * dt
        if (s.x < 0) s.x += w
        if (s.y < 0) s.y += h

        if (s.colorIndex !== fillIndex) {
          fillIndex = s.colorIndex
          ctx.fillStyle = colors.stars[fillIndex] ?? `rgb(${WHITE})`
        }
        ctx.globalAlpha =
          s.fade *
          (0.15 +
            0.7 * (0.5 + 0.5 * Math.sin(twinkleTime * s.twinkle + s.phase)))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, TAU)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    const drawMeteors = (dt: number) => {
      if (Math.random() < cfg.shootingStarChance * (1 + 5 * boost) * dt) {
        meteors.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.6,
          length: (25 + Math.random() * 45) * motionScale,
          speed: (3 + Math.random() * 4) * motionScale,
          alpha: 0.8,
        })
      }

      ctx.lineWidth = 1.2
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i]
        if (!m) continue

        m.x -= m.speed * dt
        m.y += m.speed * dt
        m.alpha -= 0.008 * dt
        if (m.alpha <= 0 || attract(m, 1.2, dt)) {
          meteors.splice(i, 1)
          continue
        }

        const tailX = m.x + m.length
        const tailY = m.y - m.length
        const trail = ctx.createLinearGradient(m.x, m.y, tailX, tailY)
        trail.addColorStop(0, `rgb(${colors.meteor})`)
        trail.addColorStop(1, `rgba(${colors.meteor}, 0)`)
        ctx.globalAlpha = m.alpha
        ctx.strokeStyle = trail
        ctx.beginPath()
        ctx.moveTo(m.x, m.y)
        ctx.lineTo(tailX, tailY)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }

    // How far the rim is pushed in or out at angle `th` (-1 to 1)
    const ripple = (th: number) =>
      Math.sin(3 * th + smokeTime * 0.0012) * 0.5 +
      Math.sin(5 * th - smokeTime * 0.0017) * 0.3 +
      Math.sin(2 * th + smokeTime * 0.0009) * 0.2

    // Closed outline whose radius ripples slightly, centered on (0, 0)
    const traceEdge = (radius: number, amp: number) => {
      ctx.beginPath()
      for (let i = 0; i <= EDGE_STEPS; i++) {
        const th = (i / EDGE_STEPS) * TAU
        const rr = radius + amp * ripple(th)
        const x = Math.cos(th) * rr
        const y = Math.sin(th) * rr
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
    }

    const drawBlackHole = () => {
      if (!bh || !glow) return

      const r = cfg.blackHoleRadius
      const reach = Math.max(cfg.blackHoleGlowRadius, r + 1)

      // A click makes the hole grow (its radius, see holeGrow). The ring and flare sit
      // on its edge and the glow and corona start there, but all their widths, and
      // the smoke, stay the same.
      const hr = r * holeGrow
      if (Math.abs(hr - gradientRadius) > 0.25) buildHoleGradients(hr)

      // A click makes the hole blob (squash one way, stretch the other, then settle).
      // Orbiting planets keep their own size.
      const wobble = clickPulse * Math.sin((1 - clickPulse) * TAU * 2)
      const sx = 1 + cfg.blackHoleClickBlob * wobble
      const sy = 1 - cfg.blackHoleClickBlob * wobble
      const shape = () => {
        ctx.rotate(blobAngle)
        ctx.scale(sx, sy)
        ctx.rotate(-blobAngle)
      }

      ctx.save()
      ctx.translate(bh.x, bh.y)

      ctx.save()
      shape()
      ctx.fillStyle = glow
      ctx.fillRect(-reach, -reach, reach * 2, reach * 2)

      if (corona) {
        const edge = hr + r * cfg.blackHoleCoronaWidth
        ctx.fillStyle = corona
        ctx.fillRect(-edge, -edge, edge * 2, edge * 2)
      }

      // Smoke: soft blobs drifting on slow looping paths around the hole
      if (puff) {
        for (const wisp of wisps) {
          const a = smokeTime * wisp.rate + wisp.phase
          const spread = reach * wisp.orbit * (0.25 + 0.5 * agitation)
          const size =
            reach *
            wisp.size *
            2 *
            (1 + 0.12 * Math.sin(smokeTime * 0.0007 + wisp.phase * 2))
          ctx.globalAlpha = Math.min(
            1,
            wisp.alpha *
              (0.3 + 0.5 * agitation) *
              cfg.blackHoleSmokeIntensity *
              (1 + 0.8 * boost)
          )
          ctx.drawImage(
            puff,
            Math.cos(a) * spread - size / 2,
            Math.sin(a * 1.3 + wisp.phase) * spread - size / 2,
            size,
            size
          )
        }
        ctx.globalAlpha = 1
      }

      ctx.restore() // end of the shaped part (glow, corona, smoke)

      drawOrbiting(false)

      ctx.save()
      shape()
      const edgeAmp =
        cfg.blackHoleEdgeRipple +
        cfg.blackHoleHoverRipple * agitation +
        4 * clickPulse
      traceEdge(hr, edgeAmp)
      ctx.fillStyle = colors.core
      ctx.fill()

      // Photon ring: a thin bright line wrapped in a soft glow. The glow is a stack
      // of strokes, each wider and fainter than the last, added to the light under
      // them (so it also blooms a little into the edge of the hole).
      traceEdge(hr + 1, edgeAmp)
      if (cfg.blackHoleRingGlow > 0) {
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        ctx.strokeStyle = `rgb(${colors.ring})`
        for (const halo of RING_GLOW) {
          ctx.globalAlpha = Math.min(
            1,
            halo.alpha * cfg.blackHoleRingGlow * (1 + buildup)
          )
          ctx.lineWidth = r * halo.width
          ctx.stroke()
        }
        ctx.restore()
      }
      ctx.strokeStyle = `rgb(${colors.ring})`
      ctx.lineWidth = 2
      ctx.stroke()
      if (cfg.blackHoleRingGlow > 0) {
        // Hot, near-white center line
        ctx.strokeStyle = `rgb(${colors.flare})`
        ctx.lineWidth = 1
        ctx.globalAlpha = Math.min(1, 0.4 + 0.4 * cfg.blackHoleRingGlow)
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // A bright flare on one side of the rim, like the diamond ring of an eclipse:
      // stacked arcs that follow the curve of the hole, each shorter, narrower and
      // brighter than the last, so the flare is thick in the middle and tapers
      // away along the edge. They straddle the rim, so the flare also lights up
      // part of the hole itself. It pulses very slightly.
      if (flare && cfg.enableBlackHoleFlare && cfg.blackHoleFlare > 0) {
        const pulse = 0.85 + 0.15 * Math.sin(smokeTime * 0.0013)
        const rimRadius = hr + 1 + edgeAmp * ripple(flareAngle) // follow the rippling rim
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        ctx.lineCap = 'round'
        ctx.strokeStyle = `rgb(${colors.flare})`
        for (const arc of FLARE_ARCS) {
          ctx.globalAlpha = Math.min(
            1,
            cfg.blackHoleFlare * (1 + 0.8 * buildup) * pulse * arc.alpha
          )
          ctx.lineWidth = r * arc.width
          ctx.beginPath()
          ctx.arc(0, 0, rimRadius, flareAngle - arc.span, flareAngle + arc.span)
          ctx.stroke()
        }
        // Hot spot where the flare is brightest
        ctx.globalAlpha = Math.min(
          1,
          cfg.blackHoleFlare * (1 + 0.8 * buildup) * pulse * 0.7
        )
        const hot = r * 0.5
        ctx.drawImage(
          flare,
          Math.cos(flareAngle) * rimRadius - hot / 2,
          Math.sin(flareAngle) * rimRadius - hot / 2,
          hot,
          hot
        )
        ctx.restore()
      }

      ctx.restore() // end of the shaped part (rim, ring, flare)

      drawOrbiting(true)

      ctx.restore()
    }

    // Back to front: haze (backdrop canvas), galaxy (its own canvas), then on this canvas
    // stars, free planets, shooting stars, and the hole with its orbiting planets (some
    // behind it, some in front).
    const draw = (now: number, dt: number) => {
      updateAscension(now, dt)
      drawBackdrop()
      drawGalaxy(dt)
      ctx.clearRect(0, 0, w, h)
      updateAgitation(dt)
      updateOrbits(dt)

      drawStars(dt)
      drawDrifting(dt)
      drawMeteors(dt)
      drawBlackHole()
    }

    // ── Setup ───────────────────────────────────────────────────────────────

    layout()
    buildHaze()
    const planets = makePlanets(cfg, w, h)
    orbiting.push(...planets.orbiting)
    drifting.push(...planets.drifting)
    const sizeRange = Math.max(0, cfg.starMaxSize - cfg.starMinSize)
    for (let i = 0; i < cfg.starCount; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: cfg.starMinSize + Math.random() * sizeRange,
        colorIndex: Math.floor(Math.random() * cfg.starColors.length),
        twinkle: randomTwinkle(),
        phase: Math.random() * TAU,
        fade: 1,
      })
    }
    stars.sort((a, b) => a.colorIndex - b.colorIndex)
    buildSprites()
    aurora.paint()
    aurora.start()
    paintVeil()

    const redrawIfStatic = () => {
      if (reducedMotion) draw(performance.now(), 0)
    }

    const onResize = () => {
      layout()
      aurora.schedule()
      bonusAurora?.schedule()
      redrawIfStatic()
    }

    // Re-resolve colors when the theme changes (data-theme/class on <html>,
    // or the OS color scheme when no manual theme is set).
    const onThemeChange = () => {
      colors = resolveColors(cfg)
      buildGlow()
      buildHaze()
      buildSprites()
      aurora.paint()
      bonusAurora?.paint()
      paintVeil()
      redrawIfStatic()
    }

    const themeObserver = new MutationObserver(onThemeChange)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    })
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)')
    colorScheme.addEventListener('change', onThemeChange)
    window.addEventListener('resize', onResize)
    if (ascensionEnabled) {
      window.addEventListener('click', onClick)
      window.addEventListener('keydown', onKeyDown)
      document.addEventListener('fullscreenchange', onFullscreenChange)
    }

    // Window-level listeners: the canvas is pointer-events-none and sits behind the page
    const onPointerMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY }
    }
    const onPointerLeave = () => {
      pointer = null
    }
    // No hover effects on mobile or with reduced motion
    if (!reducedMotion && !isMobile) {
      window.addEventListener('pointermove', onPointerMove)
      document.documentElement.addEventListener('pointerleave', onPointerLeave)
    }

    let raf = 0
    if (reducedMotion) {
      draw(performance.now(), 0)
    } else {
      let last = performance.now()
      const frame = (now: number) => {
        // dt is "frames at 60fps" so speed is the same on 60/120/144Hz screens
        const elapsed = (now - last) / 16.667
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
      window.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener(
        'pointerleave',
        onPointerLeave
      )
      colorScheme.removeEventListener('change', onThemeChange)
      themeObserver.disconnect()
      cancelAnimationFrame(raf)
      window.clearTimeout(hazeTimer)
      aurora.dispose()
      bonusAurora?.dispose()
      bonusAuroraEl?.remove()
      // Leave the page as it was, even if this runs while the scene is ascended
      for (const el of topLayers) el.style.zIndex = ''
      veil.style.opacity = '0'
      veil.style.pointerEvents = 'none'
      if (inFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(ignoreFullscreenError)
      }
    }
  }, [sanityData, isMobile])

  // Same z-index: the later one in the DOM paints on top
  return (
    <>
      <div
        ref={veilRef}
        aria-hidden
        className='pointer-events-none fixed inset-0 z-[-1] opacity-0 transition-opacity duration-[1500ms]'
      />
      <canvas
        ref={backdropRef}
        aria-hidden
        className='pointer-events-none fixed inset-0 z-[-1] h-full w-full'
      />
      <canvas
        ref={galaxyRef}
        aria-hidden
        className='pointer-events-none fixed top-0 left-0 z-[-1] origin-top-left will-change-transform'
        style={{ display: 'none' }}
      />
      <div
        ref={auroraRef}
        aria-hidden
        className='pointer-events-none fixed inset-0 z-[-1] overflow-hidden'
      />
      <canvas
        ref={canvasRef}
        aria-hidden
        className='pointer-events-none fixed inset-0 z-[-1] h-full w-full'
      />
    </>
  )
}
