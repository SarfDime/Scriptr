import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { BRAND_COLORS, BRAND_MARK } from '../config/brand'

/** Both workspaces include `shared/**`, so these read from the repository, not
 * from the published package. */
const read = (relativePath: string): string =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8')

const tokenOf = (css: string, name: string): string =>
  new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(css)?.[1] ?? ''

const sourceFor = (weight: string): string =>
  read(`../brand/${weight === 'bold' ? 'mark-bold' : 'mark'}.svg`)

test('keeps every mark weight equal to its SVG source', () => {
  for (const [weight, { width, height, d }] of Object.entries(BRAND_MARK)) {
    const svg = sourceFor(weight)

    assert.equal(/<path d="([^"]+)"/.exec(svg)?.[1], d, weight)
    assert.match(svg, new RegExp(`viewBox="0 0 ${width} ${height}"`))
  }
})

test('keeps the literal colours equal to the theme tokens', () => {
  const light = read('../../next/styles/base/colors.module.css')
  const dark = read('../../next/styles/base/colors-dark.module.css')

  assert.equal(tokenOf(light, 'color-brand'), BRAND_COLORS.light.brand)
  assert.equal(
    tokenOf(light, 'color-background'),
    BRAND_COLORS.light.background
  )
  assert.equal(tokenOf(dark, 'color-brand'), BRAND_COLORS.dark.brand)
  assert.equal(tokenOf(dark, 'color-background'), BRAND_COLORS.dark.background)
})
