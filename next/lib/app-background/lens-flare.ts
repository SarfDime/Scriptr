'use client'

import type { SkyState } from '@shared/types/skybox.types'
import { mixRGB, TAU, WHITE } from '@/lib/app-background/canvas-primitives'
import { rgba } from './skybox-canvas'

// Lens flares for immersive mode, drawn on their own overlay canvas above the
// scenery (a flare on the sky canvas would sit behind the ridge). A few ghosts on
// the line from the sun through the screen center: soft discs, a flat hexagon and a
// ring, in 'lighter' blending and tinted from the sun's colors. The nearest ghost
// hugs the sun, so the flare starts at the sun and spreads from it.
//
// They only appear with a high sun: from about 10:00, nearly full by 11:00, and
// they fade out again from about 13:00 (with the default 6-18 day). The ghosts drift
// against the pointer, each by an amount proportional to its distance from the sun
// (the sun itself never moves), with smoothing, so they trail loosely.
// All state lives in the closure `createLensFlare` returns, not in React.

/** How far the farthest ghost (k = 1) can drift, as a fraction of the viewport. */
const DRIFT_RANGE = 0.035
/** Sun elevation (0 horizon, 1 noon) where the flares start and where they are full. */
const FLARE_FROM = 0.65
const FLARE_FULL = 0.9
/** Below this strength nothing is drawn. */
const MIN_STRENGTH = 0.01

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

type GhostShape = 'disc' | 'hex' | 'ring'

type Ghost = {
  /** Where on the sun-to-center line: 0 is the sun, 1 the center, 2 the mirror of the sun. */
  k: number
  /** Fraction of the viewport's smaller side. */
  size: number
  shape: GhostShape
  alpha: number
  /** 0 is the sun's glow color, 1 its body color. */
  tint: number
}

// Most important first: a smaller screen keeps the first few. The alphas are what a
// ghost reaches at full strength; they are high on purpose, because 'lighter' blending
// over a bright noon sky washes a faint ghost out completely.
const GHOSTS: ReadonlyArray<Ghost> = [
  { k: 0.22, size: 0.034, shape: 'disc', alpha: 0.27, tint: 0.3 },
  { k: 0.9, size: 0.024, shape: 'disc', alpha: 0.3, tint: 0.8 },
  { k: 0.55, size: 0.04, shape: 'hex', alpha: 0.16, tint: 0.5 },
  { k: 1.3, size: 0.07, shape: 'ring', alpha: 0.19, tint: 0.4 },
  { k: 1.7, size: 0.038, shape: 'disc', alpha: 0.21, tint: 0.6 },
]

export const LENS_FLARE_GHOST_COUNT = GHOSTS.length

export type LensFlare = {
  /** The pointer from the screen center, -1 to 1 on both axes. Never called for touch. */
  setPointer: (x: number, y: number) => void
  /**
   * Draws the flares for this frame. Returns false when there is nothing to draw (the
   * sun is low or gone), so the caller can clear the canvas once and then skip it.
   */
  paint: (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    state: SkyState,
    deltaMs: number,
    clock: number
  ) => boolean
}

const hexagon = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number
) => {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = 0.3 + (i / 6) * TAU
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

/** A round light that fades to nothing at its edge. */
const softDisc = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rgb: string,
  alpha: number
) => {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
  gradient.addColorStop(0, rgba(rgb, alpha))
  gradient.addColorStop(0.65, rgba(rgb, alpha * 0.7))
  gradient.addColorStop(1, rgba(rgb, 0))
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fill()
}

/** `count` ghosts (the most important ones); pass the mobile-scaled number. */
export const createLensFlare = (count: number): LensFlare => {
  const ghosts = GHOSTS.slice(0, Math.max(1, count))
  // Smoothed offsets, one pair per ghost; further ghosts are slower to follow.
  const offsets = ghosts.map(() => ({ x: 0, y: 0 }))
  let pointer: { x: number; y: number } | null = null

  return {
    setPointer: (x, y) => {
      pointer = { x, y }
    },
    paint: (ctx, w, h, state, deltaMs, clock) => {
      const strength =
        state.sun.visibility *
        smoothstep(FLARE_FROM, FLARE_FULL, state.sun.elevation)
      if (strength <= MIN_STRENGTH) return false

      const min = Math.min(w, h)
      const sx = state.sun.x * w
      const sy = state.sun.y * h
      // Without a cursor (touch) the flares rest near the neutral position and only
      // drift very slowly.
      const aimX = pointer ? pointer.x : 0.35 * Math.sin(clock * 0.00005)
      const aimY = pointer ? pointer.y : 0.3 * Math.cos(clock * 0.00004)

      ctx.save()
      ctx.globalCompositeOperation = 'lighter'

      for (let i = 0; i < ghosts.length; i++) {
        const ghost = ghosts[i]
        const offset = offsets[i]
        if (!ghost || !offset) continue

        // Frame-rate independent smoothing: the time constant grows with distance.
        const follow = 1 - Math.exp(-deltaMs / (350 + ghost.k * 220))
        offset.x += (-aimX - offset.x) * follow
        offset.y += (-aimY - offset.y) * follow

        // Drift scales with k, so a ghost near the sun stays on it.
        const reach = DRIFT_RANGE * ghost.k
        const x = sx + (w / 2 - sx) * ghost.k + offset.x * reach * w
        const y = sy + (h / 2 - sy) * ghost.k + offset.y * reach * h
        const size = ghost.size * min
        const color = mixRGB(
          mixRGB(state.sun.glow, state.sun.color, ghost.tint),
          WHITE,
          0.15
        )
        const alpha = ghost.alpha * strength

        if (ghost.shape === 'disc') {
          softDisc(ctx, x, y, size, color, alpha)
        } else if (ghost.shape === 'hex') {
          hexagon(ctx, x, y, size)
          ctx.fillStyle = rgba(color, alpha)
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(x, y, size, 0, TAU)
          ctx.fillStyle = rgba(color, alpha * 0.3)
          ctx.fill()
          ctx.strokeStyle = rgba(color, alpha * 1.2)
          ctx.lineWidth = Math.max(1, size * 0.12)
          ctx.stroke()
        }
      }

      ctx.restore()
      return true
    },
  }
}
