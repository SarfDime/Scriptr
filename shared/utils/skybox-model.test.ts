import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SKY_ANCHORS, SKYBOX_DEFAULTS } from '../config/skybox'
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
