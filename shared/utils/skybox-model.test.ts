import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  applySkyColorOverrides,
  SKY_ANCHORS,
  SKY_PALETTE,
  SKYBOX_DEFAULTS,
  skyColorField,
} from '../config/skybox'
import {
  buildSkyKeyframes,
  getSkyState,
  moonHours,
  sunElevation,
} from './skybox-model'

// A stub resolver: distinct keys give distinct, mixable "r, g, b" strings, so the
// blending can be checked without a DOM.
const toRGB = (key: string) => {
  let hash = 0
  for (let i = 0; i < key.length; i++)
    hash = (hash * 31 + key.charCodeAt(i)) % 233
  return `${hash}, ${(hash * 3) % 251}, ${(hash * 7) % 241}`
}

const at = (hours: number) => getSkyState(hours, SKYBOX_DEFAULTS, toRGB)

test('the keyframes are in order and cover the whole day', () => {
  const frames = buildSkyKeyframes(SKYBOX_DEFAULTS)
  assert.equal(frames[0]?.hour, 0)
  assert.equal(frames[frames.length - 1]?.hour, 24)
  for (let i = 1; i < frames.length; i++) {
    assert.ok((frames[i]?.hour ?? 0) > (frames[i - 1]?.hour ?? 0))
  }
  assert.ok(frames.some((f) => f.hour === SKYBOX_DEFAULTS.sunriseHour))
  assert.ok(frames.some((f) => f.hour === SKYBOX_DEFAULTS.sunsetHour))
})

test('the sun rises at the anchor, is highest at noon and sets at the anchor', () => {
  const rise = at(SKYBOX_DEFAULTS.sunriseHour)
  assert.ok(rise.sun.visible)
  assert.ok(Math.abs(rise.sun.x - SKY_ANCHORS.sunriseX) < 1e-6)
  assert.ok(Math.abs(rise.sun.y - SKY_ANCHORS.horizon) < 1e-6)

  const noon = at(12)
  assert.ok(noon.sun.visible)
  assert.ok(noon.sun.y < 0.3, 'the noon sun is high')
  assert.ok(noon.sun.radius < rise.sun.radius, 'smaller at noon than low')

  const set = at(SKYBOX_DEFAULTS.sunsetHour)
  assert.ok(set.sun.visible)
  assert.ok(Math.abs(set.sun.x - SKY_ANCHORS.sunsetX) < 1e-6)
  assert.ok(Math.abs(set.sun.y - SKY_ANCHORS.horizon) < 1e-6)
})

test('the sun is hidden at night and never above the anchor at midnight', () => {
  const midnight = at(0)
  assert.equal(midnight.sun.visible, false)
  assert.ok(midnight.sun.y >= SKY_ANCHORS.horizon - 1e-9)
})

test('the moon is half a day behind the sun', () => {
  assert.equal(moonHours(0), 12)
  assert.equal(moonHours(12), 0)
  // Big and bright at midnight, small and faint at midday.
  const midnight = at(0)
  const noon = at(12)
  assert.ok(midnight.moon.opacity > 0.9)
  assert.ok(noon.moon.opacity < 0.15)
  assert.ok(midnight.moon.radius > noon.moon.radius)
  assert.ok(midnight.moon.y < noon.moon.y, 'the moon is up at night')
})

test('stars fade in with the dark', () => {
  assert.ok(at(0).starVisibility > 0.99)
  assert.ok(at(12).starVisibility < 0.01)
  assert.ok(at(SKYBOX_DEFAULTS.sunriseHour).starVisibility < 0.5)
})

test('daylight peaks at noon', () => {
  const noon = at(12).daylight
  assert.ok(noon > 0.99)
  assert.ok(at(0).daylight < 0.01)
  assert.ok(at(6).daylight < noon)
  assert.ok(at(18).daylight < noon)
})

test('the phases blend continuously: no jumps between neighbours', () => {
  const minute = 1 / 60
  for (let hours = 0; hours < 24; hours += 0.25) {
    const a = at(hours)
    const b = at(hours + minute)
    const dy = Math.abs(a.sun.y - b.sun.y)
    assert.ok(dy < 0.01, `sun y jumps at ${hours}h (${dy})`)
    // Only the wrapped noon moon may move fast; a quarter hour is still small.
    assert.ok(Math.abs(a.moon.y - b.moon.y) < 0.05)
  }
})

test('sunElevation follows the configured sunrise and sunset', () => {
  assert.ok(
    Math.abs(sunElevation(SKYBOX_DEFAULTS.sunriseHour, SKYBOX_DEFAULTS)) < 1e-9
  )
  assert.ok(sunElevation(12, SKYBOX_DEFAULTS) > 0.99)
  assert.ok(sunElevation(0, SKYBOX_DEFAULTS) < 0)
})

// The stub resolver maps a key to a color by hash, so the original palette's
// keys give different colors from the themed ones.
test('originalMix 0 is the themed palette and 1 the original one', () => {
  const themed = getSkyState(12, SKYBOX_DEFAULTS, toRGB, 0)
  const original = getSkyState(12, SKYBOX_DEFAULTS, toRGB, 1)
  assert.equal(themed.skyTop, at(12).skyTop)
  assert.notEqual(original.skyTop, themed.skyTop)
  assert.equal(original.skyTop, toRGB('sky-original-noon-top'))
  assert.equal(original.star, toRGB('sky-original-star'))

  const half = getSkyState(12, SKYBOX_DEFAULTS, toRGB, 0.5)
  assert.notEqual(half.skyTop, themed.skyTop)
  assert.notEqual(half.skyTop, original.skyTop)
})

test('immersive mode deepens the night while the moon is at its highest', () => {
  const brightness = (rgb: string) =>
    rgb.split(',').reduce((sum, channel) => sum + Number(channel), 0)

  // Midnight is the middle of the moon's cycle: it is at its highest and the sky
  // is deeper than the palette alone.
  const midnight = getSkyState(0, SKYBOX_DEFAULTS, toRGB, 1)
  assert.ok(
    brightness(midnight.skyTop) < brightness(toRGB('sky-original-night-top'))
  )
  assert.ok(
    brightness(midnight.skyBottom) <
      brightness(toRGB('sky-original-night-bottom'))
  )

  // At noon the moon sits on the horizon, so the palette is untouched, and the
  // themed palette is never deepened by the moon.
  const noon = getSkyState(12, SKYBOX_DEFAULTS, toRGB, 1)
  assert.equal(noon.skyBottom, toRGB('sky-original-noon-bottom'))
  assert.equal(at(0).skyBottom, toRGB('sky-night-bottom'))
})

test('the sun fades in over the horizon and is gone below it', () => {
  assert.equal(at(0).sun.visibility, 0)
  assert.ok(at(SKYBOX_DEFAULTS.sunriseHour).sun.visibility < 0.01)
  assert.ok(at(12).sun.visibility > 0.99)
  const rising = at(SKYBOX_DEFAULTS.sunriseHour + 0.25).sun.visibility
  assert.ok(rising > 0 && rising < 1)
})

test('a picked color replaces one phase key and leaves the rest alone', () => {
  const palette = applySkyColorOverrides(SKY_PALETTE, {
    [skyColorField('noon', 'skyTop')]: 'rose-pink',
    star: 'amber',
  })
  const noon = getSkyState(12, SKYBOX_DEFAULTS, toRGB, 0, palette)
  assert.equal(noon.skyTop, toRGB('rose-pink'))
  assert.equal(noon.skyBottom, toRGB('sky-noon-bottom'))
  assert.equal(noon.star, toRGB('amber'))
  assert.equal(at(0).star, toRGB('sky-star'), 'other states keep the default')
})

test('immersive mode ignores the picked colors', () => {
  const palette = applySkyColorOverrides(SKY_PALETTE, {
    [skyColorField('noon', 'skyTop')]: 'rose-pink',
  })
  const noon = getSkyState(12, SKYBOX_DEFAULTS, toRGB, 1, palette)
  assert.equal(noon.skyTop, toRGB('sky-original-noon-top'))
})

test('the sun, the moon and the immersive night follow the settings', () => {
  const tuned = {
    ...SKYBOX_DEFAULTS,
    sunRadius: 0.18,
    moonRadius: 0.18,
    immersiveDarkening: 0.7,
  }
  assert.ok(getSkyState(12, tuned, toRGB).sun.radius > at(12).sun.radius)
  assert.ok(getSkyState(0, tuned, toRGB).moon.radius > at(0).moon.radius)

  const brightness = (rgb: string) =>
    rgb.split(',').reduce((sum, channel) => sum + Number(channel), 0)
  assert.ok(
    brightness(getSkyState(0, tuned, toRGB, 1).skyTop) <
      brightness(getSkyState(0, SKYBOX_DEFAULTS, toRGB, 1).skyTop)
  )

  const untouched = { ...SKYBOX_DEFAULTS, immersiveDarkening: 0 }
  assert.equal(
    getSkyState(0, untouched, toRGB, 1).skyTop,
    toRGB('sky-original-night-top')
  )
})
