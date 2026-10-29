import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createConcurrencyLimiter } from './limiter'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

test('never runs more than the limit at once', async () => {
  const limit = createConcurrencyLimiter(2)
  let active = 0
  let peak = 0
  const task = async () => {
    active += 1
    peak = Math.max(peak, active)
    await sleep(5)
    active -= 1
  }

  await Promise.all(Array.from({ length: 6 }, () => limit(task)))

  assert.equal(peak, 2)
})

test('runs waiting tasks in arrival order', async () => {
  const limit = createConcurrencyLimiter(1)
  const started: Array<number> = []
  const task = (id: number) => async () => {
    started.push(id)
    await sleep(2)
  }

  await Promise.all([1, 2, 3, 4].map((id) => limit(task(id))))

  assert.deepEqual(started, [1, 2, 3, 4])
})

test('returns each task result', async () => {
  const limit = createConcurrencyLimiter(1)

  const results = await Promise.all([
    limit(async () => 'a'),
    limit(async () => 'b'),
  ])

  assert.deepEqual(results, ['a', 'b'])
})

test('keeps going after a task fails', async () => {
  const limit = createConcurrencyLimiter(1)

  await assert.rejects(
    limit(async () => {
      throw new Error('boom')
    }),
    /boom/
  )

  assert.equal(await limit(async () => 'still works'), 'still works')
})
