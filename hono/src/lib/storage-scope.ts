import type { ScriptFileInput } from '@shared/types/api.types'
import { createInternalSupabaseClient } from './supabase'

export type StorageScope = {
  bucket: string
  keyPrefix: string
}

/**
 * Resolve where a subject's files should live: which R2 bucket (from the
 * subject's university) and which dbId-based key prefix (faculty/study/subject).
 * Falls back to the default bucket and a user-scoped prefix if the subject
 * can't be resolved (e.g. not provided yet, or catalog lookup fails).
 */
export async function resolveStorageScope(
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

/** `{uuid}.{ext}`: the only shape `/file-ops/finalize` names a stored file. */
const STORED_KEY_TAIL = /^[0-9a-f-]{36}\.([a-z0-9]+)$/

/**
 * Whether a file the client reports as uploaded really lies inside `scope`:
 * the right bucket, directly under the caller's own key prefix, named the way
 * finalize names files, with an extension that matches the reported type.
 *
 * `POST /scripts` takes file keys from the client and later deletes them when
 * a request fails, so a key outside the caller's scope must be rejected before
 * it can be attached to a script or deleted.
 */
export const isFileInScope = (
  file: ScriptFileInput,
  scope: StorageScope
): boolean => {
  if (file.bucket !== scope.bucket) return false

  const prefix = `${scope.keyPrefix}/`
  if (!file.fileKey.startsWith(prefix)) return false

  const match = STORED_KEY_TAIL.exec(file.fileKey.slice(prefix.length))
  return match?.[1] === file.fileType
}

/**
 * Whether a key is shaped like one `/file-ops/finalize` made for this user:
 * `.../{userId}/{uuid}.{ext}`. A user can only ever match their own uploads, so
 * this is what makes it safe to delete keys the client names on a failure path,
 * before they have been checked against a subject's scope.
 */
export const isOwnUploadKey = (fileKey: string, userId: string): boolean => {
  const segments = fileKey.split('/')
  return (
    segments.at(-2) === userId && STORED_KEY_TAIL.test(segments.at(-1) ?? '')
  )
}
