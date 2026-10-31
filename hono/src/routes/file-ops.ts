import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { zValidator } from '@hono/zod-validator'
import {
  MAX_STORED_FILE_BYTES,
  MAX_UPLOAD_FILES,
} from '@shared/config/shared-constants'
import { UI_STRINGS } from '@shared/config/strings'
import type { FileType } from '@shared/types/api.types'
import type {
  OptimizeFileResult,
  UploadUrlsResponse,
} from '@shared/types/file-upload.types'
import type { UploadResponse } from '@shared/types/scripts.types'
import {
  getFileExtension,
  getMaxUploadBytes,
  isFileType,
} from '@shared/utils/api.utils'
import {
  isStoredFileName,
  toStoredFileName,
} from '@shared/utils/file-name.utils'
import { retrySizeCeiling } from '@shared/utils/optimizer-retry'
import { Hono } from 'hono'
import { z } from 'zod'
import { optimizeStagedFile } from '../lib/file-optimizer'
import { honoLog } from '../lib/logger'
import { createS3Client, deleteR2Files, getR2FileSizes } from '../lib/r2'
import { createRateLimiter } from '../lib/rate-limit'
import {
  createStagedUpload,
  failureResponse,
  parseStagingKey,
} from '../lib/staging'
import { resolveStorageScope } from '../lib/storage-scope'
import { authMiddleware, createInternalSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const { fileErrors } = UI_STRINGS.scripts.uploadModal

// A normal upload is one `upload-urls` and one `finalize` call; these only
// stop a single account from running up storage and optimizer work.
const UPLOAD_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const isUploadUrlsLimited = createRateLimiter({
  limit: 30,
  windowMs: UPLOAD_RATE_LIMIT_WINDOW_MS,
})
const isFinalizeLimited = createRateLimiter({
  limit: 15,
  windowMs: UPLOAD_RATE_LIMIT_WINDOW_MS,
})

/** Validates a descriptor and resolves its extension to a `FileType` (which
 * is why this is a transform: the type can't be narrowed from a string). */
const uploadFileSchema = z
  .object({
    name: z.string().min(1).max(255),
    size: z.number().int().positive(),
  })
  .transform((file, ctx) => {
    const extension = getFileExtension(file.name)
    if (!isFileType(extension)) {
      ctx.addIssue({
        code: 'custom',
        message: fileErrors.unsupportedType(extension),
      })
      return z.NEVER
    }
    const maxBytes = getMaxUploadBytes(extension)
    if (file.size > maxBytes) {
      ctx.addIssue({ code: 'custom', message: fileErrors.tooLarge(maxBytes) })
      return z.NEVER
    }
    return { fileType: extension, size: file.size }
  })

const uploadUrlsSchema = z.object({
  subjectId: z.string().min(1).optional(),
  files: z
    .array(uploadFileSchema)
    .min(1, fileErrors.noFiles)
    .max(MAX_UPLOAD_FILES, fileErrors.tooMany(MAX_UPLOAD_FILES)),
})

const finalizeSchema = z.object({
  subjectId: z.string().min(1).optional(),
  files: z
    .array(
      z.object({
        stagingKey: z.string().min(1),
        // The name the file had on the user's device. The stored display name is
        // derived from it, whatever the optimizer later does to the object.
        name: z.string().min(1).max(255),
        // What an earlier attempt at this document achieved. Only used to refuse
        // a retry that cannot fit, so a tampered client cannot make the
        // optimizer run more than it should.
        priorRejection: z
          .object({
            attemptedBytes: z.number().int().positive(),
            resultBytes: z.number().int().positive(),
          })
          .optional(),
      })
    )
    .min(1, fileErrors.noFiles)
    .max(MAX_UPLOAD_FILES, fileErrors.tooMany(MAX_UPLOAD_FILES)),
})

const fileOps = new Hono<HonoEnv>()

/**
 * Upload step 1 of 3. Returns one presigned PUT per file, into the staging
 * prefix, so the file bytes go from the browser straight to R2 and never
 * through this function (Vercel caps request bodies at 4.5 MB). Then call
 * POST /file-ops/finalize, then POST /scripts with the files it returns.
 */
fileOps.post(
  '/upload-urls',
  authMiddleware,
  zValidator('json', uploadUrlsSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: result.error.issues[0]?.message ?? fileErrors.invalidRequest,
        },
        400
      )
    }
    return
  }),
  async (c) => {
    const user = c.get('user')
    if (isUploadUrlsLimited(user.id)) {
      return c.json({ error: fileErrors.rateLimited }, 429)
    }

    const { files } = c.req.valid('json')
    const r2 = createS3Client(c)

    try {
      const uploads = await Promise.all(
        files.map((file) => createStagedUpload(c, user.id, file, r2))
      )

      return c.json<UploadUrlsResponse>({ success: true, uploads })
    } catch (error) {
      honoLog({
        logLevel: 'error',
        message: 'Failed to create upload URL(s)',
        error,
      })
      return c.json({ error: fileErrors.stagingFailed }, 500)
    }
  }
)

/**
 * Upload step 3 of 3 (step 2 is the browser's PUT). Runs each staged file
 * through the optimizer and stores the result under its final key, in the
 * subject's bucket. All-or-nothing: if any file is rejected, nothing is kept.
 * Create the script record through POST /scripts with the returned files.
 */
fileOps.post(
  '/finalize',
  authMiddleware,
  zValidator('json', finalizeSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: result.error.issues[0]?.message ?? fileErrors.invalidRequest,
        },
        400
      )
    }
    return
  }),
  async (c) => {
    const user = c.get('user')
    if (isFinalizeLimited(user.id)) {
      return c.json({ error: fileErrors.rateLimited }, 429)
    }

    const { files, subjectId } = c.req.valid('json')

    const staged: Array<{
      stagingKey: string
      declaredType: FileType
      fileName: string | null
    }> = []
    for (const { stagingKey, name } of files) {
      if (staged.some((entry) => entry.stagingKey === stagingKey)) continue
      const declaredType = parseStagingKey(stagingKey, user.id)
      if (!declaredType) {
        return c.json({ error: fileErrors.unknownUpload }, 400)
      }
      staged.push({
        stagingKey,
        declaredType,
        fileName: toStoredFileName(name),
      })
    }

    const { bucket, keyPrefix } = await resolveStorageScope(
      c,
      user.id,
      subjectId
    )

    // A file the client says was already rejected is only worth optimizing again
    // if its new size could actually land under the cap. Checked against the
    // real staged object, so the claim cannot be used to skip the work but the
    // declared size cannot be trusted either.
    if (files.some((file) => file.priorRejection)) {
      const sizes = await getR2FileSizes(
        createS3Client(c),
        files.map(({ stagingKey }) => ({
          bucket: c.env.R2_BUCKET,
          fileKey: stagingKey,
        }))
      )
      for (const [index, file] of files.entries()) {
        if (!file.priorRejection) continue
        const stagedSize = sizes[index]
        if (stagedSize === null || stagedSize === undefined) continue
        const ceiling = retrySizeCeiling(
          file.priorRejection,
          MAX_STORED_FILE_BYTES
        )
        if (stagedSize > ceiling) {
          return c.json(
            {
              error: fileErrors.retryTooLarge(file.name, ceiling),
              stagingKey: file.stagingKey,
            },
            400
          )
        }
      }
    }

    const results = await Promise.all(
      staged.map(
        async ({ stagingKey, declaredType }): Promise<OptimizeFileResult> => {
          try {
            return await optimizeStagedFile(c, {
              stagingBucket: c.env.R2_BUCKET,
              stagingKey,
              destinationBucket: bucket,
              destinationKeyBase: `${keyPrefix}/${crypto.randomUUID()}`,
              declaredType,
            })
          } catch (error) {
            honoLog({
              logLevel: 'error',
              message: 'Failed to optimize uploaded file',
              error,
            })
            return { ok: false, reason: 'failed' }
          }
        }
      )
    )

    // `fileType` and the key's extension are those of what was stored (an image
    // becomes `.webp`), while `fileName` comes from the original name, so a
    // download is named after what the user uploaded with the stored extension.
    const stored = results.flatMap((result, index) =>
      result.ok
        ? [{ ...result.file, fileName: staged[index]?.fileName ?? null }]
        : []
    )
    const failedIndex = results.findIndex((result) => !result.ok)
    const failure = results[failedIndex]

    if (failure && !failure.ok) {
      // Drop what did succeed, and every staged object, so a rejected request
      // leaves nothing behind. Cleanup problems must not mask the real error.
      await Promise.allSettled([
        deleteR2Files(c, stored),
        deleteR2Files(
          c,
          staged.map(({ stagingKey }) => ({
            bucket: c.env.R2_BUCKET,
            fileKey: stagingKey,
          }))
        ),
      ])
      const { status, message } = failureResponse(failure)
      // `stagingKey` says which file, so the client can name it; `sizeBytes` is
      // how big it was after optimizing, when that is what went wrong.
      return c.json(
        {
          error: message,
          stagingKey: staged[failedIndex]?.stagingKey,
          sizeBytes: failure.sizeBytes,
        },
        status
      )
    }

    return c.json<UploadResponse>({ success: true, files: stored })
  }
)

/**
 * `Content-Disposition` for a download: the stored name plus its extension,
 * so the saved file isn't named after its R2 key (a UUID). The name is
 * re-checked against the stored shape (kebab-case ASCII) before it goes into a
 * header; a row without a valid name just gets a plain `attachment`.
 */
const toAttachmentDisposition = (file: {
  file_name: string | null
  file_type: string
}) =>
  isStoredFileName(file.file_name)
    ? `attachment; filename="${file.file_name}.${file.file_type}"`
    : 'attachment'

/**
 * Get a pre-signed URL for downloading a file from R2. Deliberately public
 * (no authMiddleware) — every file in the app is downloadable by design,
 * guests included. "Protected" here doesn't mean identity-gated; it means
 * the requested key has to actually correspond to a real `script_files`
 * row before we'll sign a URL for it. Previously `bucket` was a
 * client-supplied query param passed straight to `GetObjectCommand` — this
 * endpoint would sign a URL for *any* bucket these R2 credentials can
 * reach, for any key string, turning it into an open pre-signed-URL
 * generator rather than a script-download endpoint. Deriving `bucket` from
 * the matched row instead closes that off without requiring anyone to be
 * logged in.
 *
 * `?download=1` makes the signed URL answer with `Content-Disposition:
 * attachment`, so the browser saves the file (named after its stored
 * `file_name`) instead of showing it. Previews use the plain URL and keep
 * rendering inline.
 */
fileOps.get('/get-file/*', async (c) => {
  const key = c.req.path.replace('/api/file-ops/get-file/', '')

  if (!key) {
    return c.json({ error: 'Key is required' }, 400)
  }

  const download = c.req.query('download') === '1'

  const supabase = createInternalSupabaseClient(c)
  const { data: file } = await supabase
    .from('script_files')
    .select('bucket, file_name, file_type')
    .eq('file_url', key)
    .single()

  if (!file) {
    return c.json(
      { error: 'File not found', details: `Key "${key}" is not a known file` },
      404
    )
  }

  const bucket = file.bucket
  const r2 = createS3Client(c)

  try {
    const url = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ...(download && {
          ResponseContentDisposition: toAttachmentDisposition(file),
        }),
      }),
      { expiresIn: 3600 }
    )

    return c.json({
      url,
      key,
    })
  } catch (error: unknown) {
    if (
      error &&
      error instanceof Error &&
      (error?.name === 'NotFound' || error?.name === 'NoSuchKey')
    ) {
      return c.json(
        {
          error: 'File not found',
          details: `Key "${key}" does not exist in bucket "${bucket}"`,
        },
        404
      )
    }

    honoLog({
      logLevel: 'error',
      message: 'Failed to generate download URL',
      error,
    })
    return c.json({ error: 'Failed to generate download URL' }, 500)
  }
})

export default fileOps
