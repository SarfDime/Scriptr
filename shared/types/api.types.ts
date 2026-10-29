import type { ApiEndpoint } from '../config/api-routes'
import type { Tables } from './database.types'

type FlagTargetType = 'user' | 'script' | 'comment'
type FileType = 'pdf' | 'jpg' | 'jpeg' | 'png' | 'webp' | 'md' | 'docx' | 'xlsx'

type Favorite = Pick<Tables<'script_favorites'>, 'created_at' | 'script_id'>
type FlagRow = Tables<'flags'>
type NotificationRecord = Tables<'notifications'>

/** Shape returned by POST /file-ops/finalize for each stored file, and
 * accepted by POST /scripts. Stays here (rather than in
 * next/types/components/Scripts.types.ts) because hono/src/routes/scripts.ts
 * imports it directly — anything a hono/ route needs must live under
 * shared/, not next/types/. The corresponding *read* shape
 * (`ScriptFile` — what a persisted script_files row actually looks like
 * once returned by a GET endpoint) has no hono/ importer and now lives
 * consolidated with the rest of the script API types in
 * next/types/components/Scripts.types.ts instead of duplicated here.
 */
type ScriptFileInput = {
  fileKey: string
  fileType: FileType
  fileSizeBytes: number
  bucket: string
  /** Kebab-case, no extension (see `toStoredFileName`); `null` when nothing
   * usable survived sanitizing. Optional so older clients keep working. */
  fileName?: string | null
}

type QueryApiEndpointType = `${ApiEndpoint}${string}` | ApiEndpoint

export type {
  Favorite,
  FileType,
  FlagRow,
  FlagTargetType,
  NotificationRecord,
  QueryApiEndpointType,
  ScriptFileInput,
}
