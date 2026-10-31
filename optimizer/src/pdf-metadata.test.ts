import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PDFDict, PDFDocument, PDFName } from 'pdf-lib'
import { stripPdfMetadata } from './pdf-metadata'

const XMP =
  '<?xpacket begin=""?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF/></x:xmpmeta>'

/** A valid PDF carrying the given number of XMP packets, one per page. */
const withXmp = async (packets: number): Promise<Uint8Array> => {
  const document = await PDFDocument.create()
  for (let index = 0; index < packets; index += 1) {
    const page = document.addPage()
    const stream = document.context.stream(XMP, {
      Type: 'Metadata',
      Subtype: 'XML',
    })
    page.node.set(PDFName.of('Metadata'), document.context.register(stream))
  }
  return document.save({ useObjectStreams: true })
}

const countMetadata = async (bytes: Uint8Array): Promise<number> => {
  const document = await PDFDocument.load(bytes, {
    updateMetadata: false,
    throwOnInvalidObject: false,
  })
  let count = 0
  for (const [, object] of document.context.enumerateIndirectObjects()) {
    if (object instanceof PDFDict && object.has(PDFName.of('Metadata'))) {
      count += 1
    }
  }
  return count
}

test('removes every embedded XMP packet', async () => {
  const before = await withXmp(12)
  assert.ok((await countMetadata(before)) > 0)

  const after = await stripPdfMetadata(before)

  assert.ok(
    after.byteLength < before.byteLength,
    `expected a smaller file, got ${after.byteLength} vs ${before.byteLength}`
  )
  assert.equal(await countMetadata(after), 0)
})

test('the stripped file is still a readable PDF with its pages', async () => {
  const before = await withXmp(4)
  const after = await stripPdfMetadata(before)

  const document = await PDFDocument.load(after)
  assert.equal(document.getPageCount(), 4)
})

test('drops the streams, not just the keys', async () => {
  // pdf-lib has no garbage collection, so removing only the /Metadata key
  // leaves the stream in the file and saves almost nothing. This is the check
  // that would catch that regression.
  const before = await withXmp(30)
  const after = await stripPdfMetadata(before)
  const packets = after.byteLength

  // 30 copies of XMP are ~30x the payload; if the streams survived the file
  // would be close to its original size.
  assert.ok(
    before.byteLength - packets > 400,
    `only ${before.byteLength - packets} bytes recovered, so the streams stayed`
  )
})

test('gives back exactly what it was given when there is no metadata', async () => {
  const document = await PDFDocument.create()
  document.addPage()
  const plain = await document.save()

  const after = await stripPdfMetadata(plain)

  assert.equal(after, plain)
})

test('gives back what it was given when the input is not a PDF', async () => {
  // Best effort: a file must never be lost because it could not be rewritten.
  const notAPdf = new TextEncoder().encode('this is not a pdf at all')

  assert.equal(await stripPdfMetadata(notAPdf), notAPdf)
})

test('gives back what it was given when the PDF is truncated', async () => {
  const truncated = (await withXmp(4)).slice(0, 200)

  assert.equal(await stripPdfMetadata(truncated), truncated)
})
