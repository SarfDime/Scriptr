import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { S3Client } from '@aws-sdk/client-s3'
import { getR2FileSizes } from './r2'

const errorNamed = (name: string) => Object.assign(new Error(name), { name })

type HeadCommandLike = {
  input: {
    // biome-ignore lint/style/useNamingConvention: mirrors the AWS SDK's input field
    Key?: string
  }
}

/** A stand-in R2 whose objects are `sizes` (keyed by object key). */
const fakeR2 = (
  sizes: Record<string, number>,
  failWith?: Error
): Pick<S3Client, 'send'> => ({
  send: (async (command: HeadCommandLike) => {
    if (failWith) throw failWith
    const size = sizes[command.input.Key ?? '']
    if (size === undefined) throw errorNamed('NotFound')
    return { ContentLength: size }
  }) as unknown as S3Client['send'],
})

const file = (fileKey: string) => ({ bucket: 'b', fileKey })

test("returns each object's real size, in order", async () => {
  const sizes = await getR2FileSizes(fakeR2({ a: 10, b: 20 }), [
    file('b'),
    file('a'),
  ])
  assert.deepEqual(sizes, [20, 10])
})

test('returns null for an object that does not exist', async () => {
  const sizes = await getR2FileSizes(fakeR2({ a: 10 }), [
    file('a'),
    file('gone'),
  ])
  assert.deepEqual(sizes, [10, null])
})

test('throws on any other error instead of reading it as "missing"', async () => {
  await assert.rejects(
    getR2FileSizes(fakeR2({}, errorNamed('AccessDenied')), [file('a')]),
    /AccessDenied/
  )
})
