import type { FileType, ScriptFileInput } from './api.types'

/** What the client knows about a file before uploading it. The content type is
 * deliberately absent: the server derives it from the extension, because
 * browsers report it inconsistently (notably for `.md`). */
export type UploadFileDescriptor = {
  name: string
  size: number
}

/** Body of `POST /file-ops/upload-urls`. */
export type UploadUrlsRequest = {
  subjectId?: string
  files: Array<UploadFileDescriptor>
}

/** A presigned PUT target for one file. The client must send `contentType` as
 * the Content-Type header and a body of exactly the declared size: both are
 * part of the signature. */
export type StagedUpload = {
  stagingKey: string
  url: string
  contentType: string
}

/** One entry per requested file, in request order. */
export type UploadUrlsResponse = {
  success: true
  uploads: Array<StagedUpload>
}

/** Body of `POST /file-ops/finalize`. The response is `UploadResponse`. */
export type FinalizeUploadRequest = {
  subjectId?: string
  files: Array<{
    stagingKey: string
    /** The file's original name. The stored display name (`fileName`) is derived
     * from it, even though the stored object may be renamed or converted. */
    name: string
    /** What an earlier attempt at this document achieved, when it was rejected
     * as too large. The API re-derives the ceiling from it so a retry that
     * cannot fit is refused without spending an optimizer run. */
    priorRejection?: {
      attemptedBytes: number
      resultBytes: number
    }
  }>
}

/*
 * Optimizer contract: implemented by the in-process stand-in in
 * hono/src/lib/file-optimizer.ts and by the optimizer service, which the API
 * calls over HTTP with `OptimizeFileRequest` as the body. The service answers
 * `200` with an `OptimizeFileResult` for anything it decided about the file
 * (including rejections). `unavailable` is only ever produced by the API's
 * client, when the service can't be reached or answers with an error status.
 */

export type OptimizeFileRequest = {
  stagingBucket: string
  stagingKey: string
  destinationBucket: string
  /** Final key without an extension. The optimizer appends the extension of
   * what it actually stores, which can differ from the uploaded one (e.g.
   * images become `.webp`). */
  destinationKeyBase: string
  declaredType: FileType
  /** Absent for script files. `avatar` crops the image square at a fixed size
   * and applies the avatar size limits instead of the script file ones. */
  purpose?: 'avatar'
}

export type OptimizeFileFailureReason =
  | 'invalid-content'
  | 'missing'
  | 'too-large'
  | 'failed'
  | 'unavailable'

export type OptimizeFileResult =
  | { ok: true; file: ScriptFileInput }
  | {
      ok: false
      reason: OptimizeFileFailureReason
      /** For `too-large`: the smallest size the file reached after optimizing,
       * which the user is told. Absent when the upload itself was over the limit. */
      sizeBytes?: number
    }
