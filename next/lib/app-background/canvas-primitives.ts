'use client'

import { nextLogs } from '@/lib/logger'

// Primitives every background canvas shares: the geometry constant, the white the
// theme resolver falls back to, and the colour helpers the painters use to build
// gradients.

export const TAU = Math.PI * 2
export const WHITE = '255, 255, 255'

/**
 * Turns a theme color key ("brand", "sky", "background-50", or any CSS color)
 * into "r, g, b".
 *
 * The browser resolves the color (oklch(), color-mix(), var() chains, ...),
 * then we paint one pixel and read it back, which always yields sRGB bytes.
 * Call this again after a theme change to pick up the new values.
 */
export const createColorResolver = () => {
  const sampler = document.createElement('canvas')
  sampler.width = 1
  sampler.height = 1
  const sctx = sampler.getContext('2d', { willReadFrequently: true })
  const themeVars = getComputedStyle(document.body)

  return (key: string): string => {
    if (!sctx) return WHITE

    const probe = document.createElement('span')
    const varName = [`--color-${key}`, `--${key}`].find((name) =>
      themeVars.getPropertyValue(name).trim()
    )
    probe.style.color = varName ? `var(${varName})` : key // else: plain CSS color like "white"

    if (!probe.style.color) {
      nextLogs({
        logLevel: 'warn',
        message: `[Canvas] Unknown color "${key}", using white`,
      })
      return WHITE
    }

    document.body.appendChild(probe)
    const css = getComputedStyle(probe).color
    probe.remove()

    sctx.clearRect(0, 0, 1, 1)
    sctx.fillStyle = css
    sctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = sctx.getImageData(0, 0, 1, 1).data
    return `${r}, ${g}, ${b}`
  }
}

export const mixRGB = (a: string, b: string, t: number) => {
  const [ar = 0, ag = 0, ab = 0] = a.split(',').map(Number)
  const [br = 0, bg = 0, bb = 0] = b.split(',').map(Number)
  const mix = (from: number, to: number) => Math.round(from + (to - from) * t)
  return `${mix(ar, br)}, ${mix(ag, bg)}, ${mix(ab, bb)}`
}

/** Brightness of an "r, g, b" string, 0 to 1; a dark background means the dark theme. */
export const luminance = (rgb: string) => {
  const [r = 0, g = 0, b = 0] = rgb.split(',').map(Number)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

/**
 * Adds color stops that fade `peak` opacity to 0 along a gradient with a smooth
 * curve whose slope is also 0 at the end, so there is no visible edge where it
 * stops. The color can blend from `from` to `to` on the way out.
 */
export const addFalloff = (
  gradient: CanvasGradient,
  from: string,
  peak: number,
  power = 2.4,
  to = from
) => {
  const steps = 10
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    gradient.addColorStop(
      t,
      `rgba(${mixRGB(from, to, t)}, ${peak * (1 - t) ** power})`
    )
  }
}
