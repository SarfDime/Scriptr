import type { FileType } from '@shared/types/api.types'
import { optimizeImage } from './image'
import { createPdfOptimizer } from './pdf'
import type { FileOptimizer } from './types'

/** Office files and Markdown can't be shrunk, so they only have to fit the cap. */
const storeAsUploaded: FileOptimizer = async (
  input,
  declaredType,
  { limits }
) =>
  input.byteLength <= limits.cap
    ? { ok: true, bytes: input, fileType: declaredType }
    : { ok: false, reason: 'too-large' }

/** Exhaustive on purpose: a new `FileType` has to say how it is handled. */
export const createOptimizers = (): Record<FileType, FileOptimizer> => ({
  pdf: createPdfOptimizer(),
  jpg: optimizeImage,
  jpeg: optimizeImage,
  png: optimizeImage,
  webp: optimizeImage,
  md: storeAsUploaded,
  docx: storeAsUploaded,
  xlsx: storeAsUploaded,
})
