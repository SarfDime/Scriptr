'use client'

import type { SkySun } from '@shared/types/skybox.types'
import { mixRGB, TAU, WHITE } from '@/lib/app-background/canvas-primitives'

// The sun, drawn as a cut-paper shape like the rest of the scenery: one flat disc,
// one flat shade along the bottom-right and one flat highlight on the top-left.
// Nothing is shaded with a gradient and there are no rays, so it reads as an
// illustration instead of a photograph of the sun; the soft halo around it belongs to
// paintSky (skybox-canvas.ts).

const rgba = (rgb: string, alpha = 1) => `rgba(${rgb}, ${alpha})`

/**
 * Draws the sun at (cx, cy) with radius `r`. `bloom` (0 to 1) scales the highlight
 * and the rim, so a bright sky is not washed out.
 */
export const paintSun = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  sun: SkySun,
  bloom: number
) => {
  const light = mixRGB(sun.color, WHITE, 0.5)
  const shade = mixRGB(sun.color, sun.glow, 0.6)

  ctx.save()
  ctx.translate(cx, cy)

  // The disc: a flat shade, then the body laid over it a little off-centre, which
  // leaves a crescent of shade along the bottom-right.
  ctx.fillStyle = rgba(shade)
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, TAU)
  ctx.fill()
  ctx.fillStyle = rgba(sun.color)
  ctx.beginPath()
  ctx.arc(-r * 0.07, -r * 0.09, r * 0.96, 0, TAU)
  ctx.fill()

  // Flat highlight, one soft-edged paper cut on the light side.
  ctx.fillStyle = rgba(light, 0.55 * (0.6 + 0.4 * bloom))
  ctx.beginPath()
  ctx.arc(-r * 0.3, -r * 0.32, r * 0.34, 0, TAU)
  ctx.fill()

  // A thin rim keeps the disc crisp on a bright sky.
  ctx.strokeStyle = rgba(light, 0.4 * bloom)
  ctx.lineWidth = Math.max(1, r * 0.035)
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.98, 0, TAU)
  ctx.stroke()

  ctx.restore()
}
