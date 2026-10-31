/**
 * Where a PDF's bytes actually are. Ghostscript can only shrink what it
 * re-encodes, so knowing whether a file is dominated by metadata, images or
 * content streams is what tells an over-target result apart from a file that
 * another downsample could still rescue.
 *
 * The scan walks the object headers of an uncompressed-cross-reference PDF and
 * sums each object's declared `/Length` by kind. It is deliberately
 * best-effort: objects inside an object stream are not visible, so `otherBytes`
 * absorbs them and the numbers are a guide, not an audit.
 */
export type PdfBloatReport = {
  bytes: number
  metadataBytes: number
  metadataCount: number
  imageBytes: number
  imageCount: number
  fontBytes: number
  contentBytes: number
  otherBytes: number
}

const OBJECT_HEADER = /(\d{1,10})[ \t]+(\d{1,5})[ \t]+obj\b/g
const LENGTH = /\/Length[ \t]+(\d{1,10})/
const STREAM = /stream\r?\n/
const XMP = /\/Type[ \t]*\/Metadata|\/Subtype[ \t]*\/XML/
const IMAGE = /\/Subtype[ \t]*\/Image/
const FONT = /\/FontFile[23]?|\/Length1[ \t]|\/Subtype[ \t]*\/Type1C/

/** Declared stream length, or 0 for an object that is only a dictionary. */
const streamLength = (object: string): number => {
  if (!STREAM.test(object)) return 0
  const declared = LENGTH.exec(object)?.[1]
  return declared === undefined ? 0 : Number.parseInt(declared, 10)
}

const emptyReport = (bytes: number): PdfBloatReport => ({
  bytes,
  metadataBytes: 0,
  metadataCount: 0,
  imageBytes: 0,
  imageCount: 0,
  fontBytes: 0,
  contentBytes: 0,
  otherBytes: 0,
})

/**
 * Sums a PDF's bytes by what each object holds. Returns `null` rather than
 * throwing when the input cannot be read as Latin-1 text at all, so a caller
 * logging a diagnosis never turns a size problem into a failure.
 */
export const inspectPdf = (input: Uint8Array): PdfBloatReport | null => {
  let text: string
  try {
    text = Buffer.from(
      input.buffer,
      input.byteOffset,
      input.byteLength
    ).toString('latin1')
  } catch {
    return null
  }

  const starts: Array<number> = []
  for (
    let match = OBJECT_HEADER.exec(text);
    match !== null;
    match = OBJECT_HEADER.exec(text)
  ) {
    starts.push(match.index)
  }
  if (starts.length === 0) return null

  const report = emptyReport(input.byteLength)
  for (const [index, start] of starts.entries()) {
    const next = starts[index + 1] ?? text.length
    const object = text.slice(start, next)
    const length = streamLength(object)

    if (XMP.test(object)) {
      report.metadataBytes += length
      report.metadataCount += 1
    } else if (IMAGE.test(object)) {
      report.imageBytes += length
      report.imageCount += 1
    } else if (FONT.test(object)) {
      report.fontBytes += length
    } else if (length > 0) {
      report.contentBytes += length
    } else {
      report.otherBytes += object.length
    }
  }
  return report
}

const asMb = (bytes: number): string => `${(bytes / 1024 / 1024).toFixed(1)} MB`

const share = (part: number, whole: number): string =>
  whole > 0 ? `${Math.round((part / whole) * 100)}%` : '0%'

/**
 * One clause naming what is holding the size up. Ghostscript re-emits XMP it
 * finds attached to embedded artwork and will not drop it, so a file that is
 * mostly metadata cannot be helped by a harsher downsample — saying so is more
 * useful in the log than another attempt that costs quality.
 */
export const describePdfBloat = (report: PdfBloatReport): string => {
  const { bytes, metadataBytes, imageBytes, contentBytes } = report
  if (bytes <= 0) return 'nothing readable to measure'

  if (metadataBytes / bytes >= 0.25) {
    return `metadata is ${asMb(metadataBytes)} of ${asMb(bytes)} (${share(metadataBytes, bytes)}) and images are only ${asMb(imageBytes)} (${share(imageBytes, bytes)}), so downsampling has almost nothing to remove`
  }
  if (imageBytes >= contentBytes) {
    return `images are ${asMb(imageBytes)} of ${asMb(bytes)} (${share(imageBytes, bytes)}) across ${report.imageCount} of them, so downsampling is what helps`
  }
  return `content streams are ${asMb(contentBytes)} of ${asMb(bytes)} (${share(contentBytes, bytes)}), so the page description cannot be shrunk much further`
}
