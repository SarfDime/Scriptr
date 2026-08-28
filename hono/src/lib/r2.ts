import { S3Client } from '@aws-sdk/client-s3'
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
