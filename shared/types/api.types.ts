import type { ApiEndpoint } from '@shared/config/api-routes'
import type { Tables } from './database.types'

type UserRole = 'student' | 'moderator' | 'admin'
type ProfileSubjectStatus = 'completed' | 'currently_taking'
type FlagStatus = 'pending' | 'reviewed' | 'dismissed'
type FlagTargetType = 'user' | 'script' | 'comment'
type FileType =
  | 'pdf'
  | 'jpg'
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'md'
  | 'doc'
  | 'docx'
  | 'xls'
  | 'xlsx'

type ProfileSubject = Pick<
  Tables<'profile_subjects'>,
  'subject_id' | 'updated_at'
> & {
  status: ProfileSubjectStatus
}

type Favorite = Pick<Tables<'script_favorites'>, 'created_at' | 'script_id'>

/** Shape returned by POST /file-ops/upload for each uploaded file, and accepted by POST /scripts. */
type ScriptFileInput = {
  fileKey: string
  fileType: FileType
  fileSizeBytes: number
  bucket: string
}

type QueryApiEndpointType = `${ApiEndpoint}${string}` | ApiEndpoint

export type {
  Favorite,
  FileType,
  FlagStatus,
  FlagTargetType,
  ProfileSubject,
  ProfileSubjectStatus,
  QueryApiEndpointType,
  ScriptFileInput,
  UserRole,
}
