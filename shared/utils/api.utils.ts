import type { AcademicEntityType } from '@shared/config/api'
import { type ApiEndpoint, apiRoutes } from '@shared/config/api-routes'
import type {
  FileType,
  FlagStatus,
  FlagTargetType,
  ProfileSubjectStatus,
  ScriptFileInput,
  UserRole,
} from '../types/api.types'
import { generatePath } from './common-utils'

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  'trashmail.com',
  'yopmail.com',
  'dispostable.com',
  'sharklasers.com',
  'maildrop.cc',
  'throwawaymail.com',
  'anonbox.net',
])

const isUserRole = (value: unknown): value is UserRole =>
  value === 'student' || value === 'moderator' || value === 'admin'

function isAdmin(role: unknown): boolean {
  return role === 'admin'
}

function validateUsername(username: unknown): string | null {
  if (typeof username !== 'string') {
    return 'Username is required'
  }

  const normalizedUsername = username.trim()
  if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
    return 'Username must be between 3 and 30 characters'
  }
  if (!USERNAME_PATTERN.test(normalizedUsername)) {
    return 'Username can only contain letters, numbers, hyphens, and underscores'
  }
  return null
}

function validateEmailAddress(email: unknown): string | null {
  if (typeof email !== 'string') {
    return 'Email is required'
  }

  const normalizedEmail = email.trim()
  if (!normalizedEmail) {
    return 'Email is required'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return 'Enter a valid email address'
  }
  if (isDisposableEmail(normalizedEmail)) {
    return 'Please use a permanent email address'
  }
  return null
}

function isDisposableEmail(email: string): boolean {
  const domain = email.trim().split('@')[1]?.toLowerCase()
  if (!domain) return false
  return DISPOSABLE_EMAIL_DOMAINS.has(domain)
}

const isProfileSubjectStatus = (
  value: unknown
): value is ProfileSubjectStatus =>
  value === 'completed' || value === 'currently_taking'

const isFlagStatus = (value: unknown): value is FlagStatus =>
  value === 'pending' || value === 'reviewed' || value === 'dismissed'

const isFlagTargetType = (value: unknown): value is FlagTargetType =>
  value === 'user' || value === 'script' || value === 'comment'

const isFileType = (value: unknown): value is FileType =>
  value === 'pdf' ||
  value === 'jpg' ||
  value === 'jpeg' ||
  value === 'png' ||
  value === 'webp' ||
  value === 'md' ||
  value === 'doc' ||
  value === 'docx' ||
  value === 'xls' ||
  value === 'xlsx'

const isScriptFileInput = (value: unknown): value is ScriptFileInput => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ScriptFileInput).fileKey === 'string' &&
    isFileType((value as ScriptFileInput).fileType) &&
    Number.isInteger((value as ScriptFileInput).fileSizeBytes) &&
    (value as ScriptFileInput).fileSizeBytes > 0 &&
    typeof (value as ScriptFileInput).bucket === 'string' &&
    (value as ScriptFileInput).bucket.length > 0
  )
}

function getDatabaseAcademicEndpoints(entityType: AcademicEntityType) {
  const { internal } = apiRoutes

  switch (entityType) {
    case 'university':
      return {
        create: internal.universities,
        sync: (id: string) => internal.universitiesSyncById(id),
        byId: (id: string) => internal.universitiesById(id),
      }
    case 'faculty':
      return {
        create: internal.faculties,
        sync: (id: string) => internal.facultiesSyncById(id),
        byId: (id: string) => internal.facultiesById(id),
      }
    case 'study':
      return {
        create: internal.studies,
        sync: (id: string) => internal.studiesSyncById(id),
        byId: (id: string) => internal.studiesById(id),
      }
    case 'subject':
      return {
        create: internal.subjects,
        sync: (id: string) => internal.subjectsSyncById(id),
        byId: (id: string) => internal.subjectsById(id),
      }
    case 'professor':
      return {
        create: internal.professors,
        sync: (id: string) => internal.professorsSyncById(id),
        byId: (id: string) => internal.professorsById(id),
      }
    default: {
      // biome-ignore lint/style/useNamingConvention: exhaustive check
      const _exhaustive: never = entityType
      throw new Error(`Unhandled entity type: ${_exhaustive}`)
    }
  }
}

const apiUrl = (path: ApiEndpoint, base: string = 'http://localhost:8787') => {
  return generatePath({ segments: [base, path] })
}

export {
  apiUrl,
  getDatabaseAcademicEndpoints,
  isAdmin,
  isDisposableEmail,
  isFileType,
  isFlagStatus,
  isFlagTargetType,
  isProfileSubjectStatus,
  isScriptFileInput,
  isUserRole,
  validateEmailAddress,
  validateUsername,
}
