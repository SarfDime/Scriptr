import {
  DeleteObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { isMissingObjectError } from '@shared/utils/r2.utils'
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

/**
 * The real size of each file's object, in order, or `null` for one that doesn't
 * exist. Anything other than "not found" (R2 down, bad credentials, ...) throws
 * rather than being read as "missing".
 */
export async function getR2FileSizes(
  r2: Pick<S3Client, 'send'>,
  files: ReadonlyArray<{ bucket: string; fileKey: string }>
): Promise<Array<number | null>> {
  return Promise.all(
    files.map(async ({ bucket, fileKey }) => {
      try {
        const head = await r2.send(
          new HeadObjectCommand({ Bucket: bucket, Key: fileKey })
        )
        return head.ContentLength ?? 0
      } catch (error) {
        if (isMissingObjectError(error)) return null
        throw error
      }
    })
  )
}
