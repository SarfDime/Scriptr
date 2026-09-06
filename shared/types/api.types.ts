import type { Tables } from './database.types'

export type UserRole = 'student' | 'moderator'
export type ProfileSubjectStatus = 'completed' | 'currently_taking'
export type FlagStatus = 'pending' | 'reviewed' | 'dismissed'
export type FlagTargetType = 'user' | 'script' | 'comment'
export type FileType = 'pdf' | 'jpg' | 'jpeg' | 'png' | 'webp'

export type ProfileSubject = Pick<
  Tables<'profile_subjects'>,
  'subject_id' | 'updated_at'
> & {
  status: ProfileSubjectStatus
}

export type Favorite = Pick<
  Tables<'script_favorites'>,
  'created_at' | 'script_id'
>
