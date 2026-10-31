import assert from 'node:assert/strict'
import { test } from 'node:test'
import { describePdfBloat, inspectPdf } from './pdf-bloat'

const encoder = new TextEncoder()

/** A PDF-shaped byte string: object headers, dictionaries and declared stream
 * lengths are all the inspector looks at, so that is all this needs. */
const pdf = (
  objects: ReadonlyArray<{
    readonly dict: string
    readonly streamBytes: number
  }>
): Uint8Array => {
  const parts: Array<string> = ['%PDF-1.7\n']
  for (const [index, { dict, streamBytes }] of objects.entries()) {
    parts.push(`${index + 1} 0 obj\n`)
    parts.push(
      streamBytes > 0
        ? `<</Length ${streamBytes}${dict}>>\nstream\n${'x'.repeat(streamBytes)}\nendstream\n`
        : `<</Length 0${dict}>>\n`
    )
    parts.push('endobj\n')
  }
  return encoder.encode(parts.join(''))
}

const kilobytes = 1024

test('reports nothing for bytes that hold no objects', () => {
  assert.equal(inspectPdf(encoder.encode('%PDF-1.7 and nothing else')), null)
})

test('splits the bytes by what each object holds', () => {
  const report = inspectPdf(
    pdf([
      { dict: '/Type/Metadata/Subtype/XML', streamBytes: 8 * kilobytes },
      { dict: '/Subtype/Image/Width 10/Height 10', streamBytes: 2 * kilobytes },
      { dict: '/Filter/FlateDecode', streamBytes: 4 * kilobytes },
      { dict: '/Length1 900', streamBytes: kilobytes },
    ])
  )

  assert.ok(report)
  assert.equal(report.metadataCount, 1)
  assert.equal(report.metadataBytes, 8 * kilobytes)
  assert.equal(report.imageCount, 1)
  assert.equal(report.imageBytes, 2 * kilobytes)
  assert.equal(report.contentBytes, 4 * kilobytes)
  assert.equal(report.fontBytes, kilobytes)
})

test('counts every XMP packet, not just the document one', () => {
  // The case that matters: an InDesign export carrying one XMP packet per
  // embedded piece of artwork.
  const report = inspectPdf(
    pdf(
      Array.from({ length: 20 }, () => ({
        dict: '/Type/Metadata/Subtype/XML',
        streamBytes: 10 * kilobytes,
      }))
    )
  )

  assert.ok(report)
  assert.equal(report.metadataCount, 20)
  assert.equal(report.metadataBytes, 200 * kilobytes)
})

test('names metadata when that is what is holding the size up', () => {
  const description = describePdfBloat({
    bytes: 15 * 1024 * kilobytes,
    metadataBytes: 11 * 1024 * kilobytes,
    metadataCount: 484,
    imageBytes: 1.5 * 1024 * kilobytes,
    imageCount: 1699,
    fontBytes: 0,
    contentBytes: 2 * 1024 * kilobytes,
    otherBytes: 0,
  })

  assert.match(description, /metadata is 11\.0 MB of 15\.0 MB \(73%\)/)
  assert.match(description, /images are only 1\.5 MB \(10%\)/)
  assert.match(description, /almost nothing to remove/)
})

test('names images when downsampling is the lever that works', () => {
  const description = describePdfBloat({
    bytes: 10 * 1024 * kilobytes,
    metadataBytes: 0,
    metadataCount: 0,
    imageBytes: 8 * 1024 * kilobytes,
    imageCount: 40,
    fontBytes: 0,
    contentBytes: 2 * 1024 * kilobytes,
    otherBytes: 0,
  })

  assert.match(description, /images are 8\.0 MB of 10\.0 MB \(80%\)/)
  assert.match(description, /across 40 of them/)
  assert.match(description, /downsampling is what helps/)
})

test('names content streams when neither of the others dominates', () => {
  const description = describePdfBloat({
    bytes: 10 * 1024 * kilobytes,
    metadataBytes: 0,
    metadataCount: 0,
    imageBytes: 2 * 1024 * kilobytes,
    imageCount: 5,
    fontBytes: 0,
    contentBytes: 8 * 1024 * kilobytes,
    otherBytes: 0,
  })

  assert.match(description, /content streams are 8\.0 MB of 10\.0 MB \(80%\)/)
  assert.match(description, /cannot be shrunk much further/)
})

test('copes with an empty file instead of dividing by zero', () => {
  assert.equal(
    describePdfBloat({
      bytes: 0,
      metadataBytes: 0,
      metadataCount: 0,
      imageBytes: 0,
      imageCount: 0,
      fontBytes: 0,
      contentBytes: 0,
      otherBytes: 0,
    }),
    'nothing readable to measure'
  )
})
