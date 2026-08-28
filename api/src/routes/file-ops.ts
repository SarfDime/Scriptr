import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Hono } from 'hono'
import { createS3Client } from '../lib/r2'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const fileOps = new Hono<HonoEnv>()

/** Upload a script to R2 and persist its metadata in Supabase. */
fileOps.post('/upload', authMiddleware, async (c) => {
  const user = c.get('user')
  const body = await c.req.parseBody()
  const file = body.file
  const title = body.title
  const subjectId = body.subjectId

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  ]
  if (!(file instanceof File) || !allowedTypes.includes(file.type)) {
    return c.json(
      {
        error: 'Only PDF and Word documents (.pdf, .doc, .docx) are allowed',
      },
      400,
    )
  }

  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return c.json({ error: 'File too large. Maximum size is 10MB' }, 400)
  }

  if (typeof title !== 'string' || typeof subjectId !== 'string') {
    return c.json({ error: 'Title and subjectId are required' }, 400)
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'

  const fileKey = `${user.id}/${crypto.randomUUID()}.${fileExt}`

  const r2 = createS3Client(c)

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: c.env.R2_BUCKET,
        Key: fileKey,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
      }),
    )

    const fileUrl = `${c.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${fileKey}`
    const supabase = createSupabaseClient(c)
    const { data, error } = await supabase
      .from('scripts')
      .insert({
        title,
        subject_id: subjectId,
        author_id: user.id,
        description:
          typeof body.description === 'string' ? body.description : '',
        file_type: file.type,
        file_url: fileUrl,
        vote_score: 0,
        download_count: 0,
      })
      .select()
      .single()

    if (error) {
      await r2.send(
        new DeleteObjectCommand({ Bucket: c.env.R2_BUCKET, Key: fileKey }),
      )
      return c.json({ error: 'Failed to save file metadata' }, 500)
    }

    return c.json({ success: true, key: fileKey, url: fileUrl, script: data })
  } catch (error) {
    return c.json(
      {
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : undefined,
      },
      500,
    )
  }
})

/** Get pre-signed URL for downloading a file from R2 */
fileOps.get('/get-file/*', async (c) => {
  const key = c.req.path.replace('/api/file-ops/get-file/', '')

  if (!key) {
    return c.json({ error: 'Key is required' }, 400)
  }

  const r2 = createS3Client(c)

  try {
    const url = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: c.env.R2_BUCKET,
        Key: key,
      }),
      { expiresIn: 3600 },
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
          details: `Key "${key}" does not exist in bucket`,
        },
        404,
      )
    }

    return c.json(
      {
        error: 'Failed to generate download URL',
        details: error instanceof Error ? error?.message : error,
      },
      500,
    )
  }
})

export default fileOps
