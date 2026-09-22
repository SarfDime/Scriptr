import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { isFileType } from '../../../shared/utils/api.utils'
import { createS3Client } from '../lib/r2'
import { authMiddleware, createInternalSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/markdown',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const

const MAX_FILE_SIZE_BYTES = 1024 * 1024

const uploadedFileSchema = z
  .instanceof(File)
  .refine(
    (file) => (ALLOWED_MIME_TYPES as ReadonlyArray<string>).includes(file.type),
    {
      message: 'Unsupported file type',
    }
  )
  .refine((file) => file.size <= MAX_FILE_SIZE_BYTES, {
    message: 'File exceeds the 1MB size limit',
  })
  .refine(
    (file) => isFileType(file.name.split('.').pop()?.toLowerCase() ?? ''),
    { message: 'Unsupported file extension' }
  )

const uploadFormSchema = z.object({
  subjectId: z.string().min(1).optional(),
  // A single-file form submission arrives as one File, not an array —
  // normalize to an array before validating each entry.
  files: z.preprocess(
    (value) => (Array.isArray(value) ? value : [value]),
    z.array(uploadedFileSchema).min(1, 'At least one file is required')
  ),
})

type StorageScope = {
  bucket: string
  keyPrefix: string
}

/**
 * Resolve where a subject's files should live: which R2 bucket (from the
 * subject's university) and which dbId-based key prefix (faculty/study/subject).
 * Falls back to the default bucket and a user-scoped prefix if the subject
 * can't be resolved (e.g. not provided yet, or catalog lookup fails).
 */
async function resolveStorageScope(
  c: Parameters<typeof createInternalSupabaseClient>[0] & {
    // biome-ignore lint/style/useNamingConvention: <Ignore naming convention for env>
    env: { R2_BUCKET: string }
  },
  userId: string,
  subjectId: string | undefined
): Promise<StorageScope> {
  const fallback: StorageScope = {
    bucket: c.env.R2_BUCKET,
    keyPrefix: userId,
  }

  if (!subjectId) return fallback

  const supabase = createInternalSupabaseClient(c)

  const { data, error } = await supabase
    .from('subjects')
    .select(
      `id,
       study:studies(
         id,
         faculty:faculties(
           id,
           university:universities(r2_bucket_id)
         )
       )`
    )
    .eq('id', subjectId)
    .single()

  const study = data?.study
  const faculty = study?.faculty
  const bucket = faculty?.university?.r2_bucket_id

  if (error || !study || !faculty) {
    return fallback
  }

  return {
    bucket: bucket || c.env.R2_BUCKET,
    keyPrefix: `${faculty.id}/${study.id}/${subjectId}/${userId}`,
  }
}

const fileOps = new Hono<HonoEnv>()

/** Upload one or more script files to R2 in a single call; create the script record through POST /scripts. */
fileOps.post(
  '/upload',
  authMiddleware,
  zValidator('form', uploadFormSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: result.error.issues[0]?.message ?? 'Invalid upload' },
        400
      )
    }
    return
  }),
  async (c) => {
    const user = c.get('user')
    const { files, subjectId } = c.req.valid('form')

    const { bucket, keyPrefix } = await resolveStorageScope(
      c,
      user.id,
      subjectId
    )
    const r2 = createS3Client(c)

    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const fileType = file.name.split('.').pop()?.toLowerCase() || 'bin'
          const fileKey = `${keyPrefix}/${crypto.randomUUID()}.${fileType}`

          await r2.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: fileKey,
              Body: Buffer.from(await file.arrayBuffer()),
              ContentType: file.type,
            })
          )

          return { fileKey, fileType, fileSizeBytes: file.size, bucket }
        })
      )

      return c.json({ success: true, files: uploaded })
    } catch (error) {
      return c.json(
        {
          error: 'Failed to upload file(s)',
          details: error instanceof Error ? error.message : undefined,
        },
        500
      )
    }
  }
)

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
 */
fileOps.get('/get-file/*', async (c) => {
  const key = c.req.path.replace('/api/file-ops/get-file/', '')

  if (!key) {
    return c.json({ error: 'Key is required' }, 400)
  }

  const supabase = createInternalSupabaseClient(c)
  const { data: file } = await supabase
    .from('script_files')
    .select('bucket')
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

    return c.json(
      {
        error: 'Failed to generate download URL',
        details: error instanceof Error ? error?.message : error,
      },
      500
    )
  }
})

export default fileOps
