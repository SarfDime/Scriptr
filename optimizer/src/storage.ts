import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3'
import { isMissingObjectError } from '@shared/utils/r2.utils'

type WriteOptions = {
  contentType: string
  cacheControl: string
}

/** The few object operations the optimizer needs, so tests can swap R2 out. */
export type ObjectStorage = {
  /** Size in bytes, or `null` if the object doesn't exist. */
  size: (bucket: string, key: string) => Promise<number | null>
  /** The object's bytes, or `null` if it doesn't exist. */
  read: (bucket: string, key: string) => Promise<Uint8Array | null>
  write: (
    bucket: string,
    key: string,
    bytes: Uint8Array,
    options: WriteOptions
  ) => Promise<void>
  remove: (bucket: string, key: string) => Promise<void>
}

/** Anything but "not found" (R2 down, bad credentials, ...) is thrown. */
export const createR2Storage = (
  client: Pick<S3Client, 'send'>
): ObjectStorage => ({
  size: async (bucket, key) => {
    try {
      const head = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key })
      )
      return head.ContentLength ?? 0
    } catch (error) {
      if (isMissingObjectError(error)) return null
      throw error
    }
  },
  read: async (bucket, key) => {
    try {
      const object = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
      )
      return (await object.Body?.transformToByteArray()) ?? null
    } catch (error) {
      if (isMissingObjectError(error)) return null
      throw error
    }
  },
  write: async (bucket, key, bytes, { contentType, cacheControl }) => {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: bytes,
        ContentType: contentType,
        CacheControl: cacheControl,
      })
    )
  },
  remove: async (bucket, key) => {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
  },
})
