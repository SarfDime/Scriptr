import type {
  FileType,
  FlagStatus,
  FlagTargetType,
  ProfileSubjectStatus,
  UserRole,
} from '../types/api.types'

export const isUserRole = (value: unknown): value is UserRole =>
  value === 'student' || value === 'moderator'

export const isProfileSubjectStatus = (
  value: unknown
): value is ProfileSubjectStatus =>
  value === 'completed' || value === 'currently_taking'

export const isFlagStatus = (value: unknown): value is FlagStatus =>
  value === 'pending' || value === 'reviewed' || value === 'dismissed'

export const isFlagTargetType = (value: unknown): value is FlagTargetType =>
  value === 'user' || value === 'script' || value === 'comment'

export const isFileType = (value: unknown): value is FileType =>
  value === 'pdf' ||
  value === 'jpg' ||
  value === 'jpeg' ||
  value === 'png' ||
  value === 'webp'
