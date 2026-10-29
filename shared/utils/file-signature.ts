import type { FileType } from '../types/api.types'

const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04]
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff]
// PDF readers accept the header anywhere in the first KiB.
const PDF_HEADER_WINDOW_BYTES = 1024
const UTF8_DECODER = new TextDecoder('utf-8', { fatal: true })
// Every byte maps to a character, so searching for ASCII text works on binary.
const LATIN1_DECODER = new TextDecoder('latin1')

const ascii = (text: string): Array<number> =>
  Array.from(text, (character) => character.charCodeAt(0))

const hasBytesAt = (
  bytes: Uint8Array,
  expected: ReadonlyArray<number>,
  offset = 0
): boolean => expected.every((byte, index) => bytes[offset + index] === byte)

const containsText = (
  bytes: Uint8Array,
  text: string,
  limit = bytes.byteLength
): boolean => LATIN1_DECODER.decode(bytes.subarray(0, limit)).includes(text)

const isPlainUtf8 = (bytes: Uint8Array): boolean => {
  if (bytes.includes(0)) return false
  try {
    UTF8_DECODER.decode(bytes)
    return true
  } catch {
    return false
  }
}

/**
 * Whether the bytes really are the declared type, rather than trusting the
 * file name. Office files are zips, so they're also required to contain their
 * main part (which rules out e.g. a `.docm` or `.pptx` renamed to `.docx`).
 */
export const matchesFileSignature = (
  fileType: FileType,
  bytes: Uint8Array
): boolean => {
  switch (fileType) {
    case 'pdf':
      return containsText(bytes, '%PDF-', PDF_HEADER_WINDOW_BYTES)
    case 'jpg':
    case 'jpeg':
      return hasBytesAt(bytes, JPEG_SIGNATURE)
    case 'png':
      return hasBytesAt(bytes, PNG_SIGNATURE)
    case 'webp':
      return (
        hasBytesAt(bytes, ascii('RIFF')) && hasBytesAt(bytes, ascii('WEBP'), 8)
      )
    case 'docx':
      return (
        hasBytesAt(bytes, ZIP_SIGNATURE) &&
        containsText(bytes, 'word/document.xml')
      )
    case 'xlsx':
      return (
        hasBytesAt(bytes, ZIP_SIGNATURE) &&
        containsText(bytes, 'xl/workbook.xml')
      )
    case 'md':
      return isPlainUtf8(bytes)
    default: {
      // biome-ignore lint/style/useNamingConvention: exhaustive check
      const _exhaustive: never = fileType
      throw new Error(`Unhandled file type: ${_exhaustive}`)
    }
  }
}
