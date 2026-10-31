import { PDFDict, PDFDocument, PDFName, PDFRef } from 'pdf-lib'

export type StripPdfMetadata = (input: Uint8Array) => Promise<Uint8Array>

/**
 * Removes the XMP packets embedded in a PDF.
 *
 * Worth doing before Ghostscript rather than after: Ghostscript re-emits the
 * XMP it finds attached to embedded artwork instead of dropping it, so leaving
 * it in costs both the bytes it occupies and the work of copying it through.
 * On a real 15.7 MB InDesign manual 476 packets were 11.4 MB of the file, and
 * removing them took it to 4.0 MB with no image touched at all — enough that
 * the document then fitted the cap at 150 dpi where it otherwise needed 72.
 *
 * Both the `/Metadata` key and the stream it points at are removed; pdf-lib has
 * no garbage collection, so deleting only the key would leave the stream in the
 * file and save almost nothing.
 *
 * Best effort by design: anything that cannot be read or rewritten — encrypted,
 * damaged, or simply a format pdf-lib does not handle — comes back untouched so
 * the caller falls back to Ghostscript alone. A file is never lost to a
 * metadata problem, and the caller only uses the result when it is smaller.
 */
export const stripPdfMetadata: StripPdfMetadata = async (input) => {
  try {
    const document = await PDFDocument.load(input, {
      updateMetadata: false,
      throwOnInvalidObject: false,
    })

    let removed = 0
    for (const [, object] of document.context.enumerateIndirectObjects()) {
      if (!(object instanceof PDFDict)) continue
      const metadata = object.get(PDFName.of('Metadata'))
      if (metadata === undefined) continue
      if (metadata instanceof PDFRef) document.context.delete(metadata)
      object.delete(PDFName.of('Metadata'))
      removed += 1
    }
    if (removed === 0) return input

    const stripped = await document.save({ useObjectStreams: true })
    return stripped.byteLength < input.byteLength ? stripped : input
  } catch {
    return input
  }
}
