import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { Context } from 'hono'

import type { HonoEnv } from '../types/env.types'

/** Create an S3 client with the given context, using environment variables for the endpoint and credentials.
 */
export function createS3Client(c: Context<HonoEnv>) {
  return new S3Client({
    region: 'auto',
    endpoint: c.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: c.env.R2_ACCESS_KEY_ID,
      secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
    },
  })
}

export async function deleteR2Files(
  c: Context<HonoEnv>,
  files: ReadonlyArray<{ bucket: string; fileKey: string }>
) {
  if (files.length === 0) return

  const r2 = createS3Client(c)
  const results = await Promise.allSettled(
    files.map(({ bucket, fileKey }) =>
      r2.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: fileKey,
        })
      )
    )
  )

  const failed = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  )
  if (failed.length > 0) {
    throw new Error(`Failed to delete ${failed.length} R2 file(s)`)
  }
}
