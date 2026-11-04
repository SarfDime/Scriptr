import type { AcademicEntityType } from '../config/api'
import { type ApiEndpoint, apiRoutes } from '../config/api-routes'
import {
  MAX_STORED_FILE_BYTES,
  MAX_UPLOAD_FILE_BYTES,
  OPTIMIZABLE_FILE_TYPES,
} from '../config/shared-constants'
import type {
  FileType,
  FlagTargetType,
  ScriptFileInput,
} from '../types/api.types'
import type { FlagStatus } from '../types/flags.types'
import type { ProfileSubjectStatus, UserRole } from '../types/profile.types'
import { generatePath } from './common-utils'
import { isStoredFileName } from './file-name.utils'

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/
const MIN_PASSWORD_LENGTH = 8
// Mirrors Supabase Auth's "lowercase, uppercase, digits and symbols" password
// requirement (including its exact symbol set). Order = order errors surface.
const PASSWORD_RULES = [
  { pattern: /[a-z]/, message: 'Password must include a lowercase letter' },
  { pattern: /[A-Z]/, message: 'Password must include an uppercase letter' },
  { pattern: /[0-9]/, message: 'Password must include a digit' },
  {
    pattern: /[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]/,
    message: 'Password must include a symbol, e.g. ! @ # $ %',
  },
] as const
const FULL_NAME_CHARACTERS = /^[\p{L} ]+$/u
const FULL_NAME_CAPITAL_START = /^\p{Lu}/u
const MIN_FULL_NAME_LETTERS = 4
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

function validateFullName(fullName: unknown): string | null {
  if (typeof fullName !== 'string' || fullName.trim() === '') {
    return 'Full name is required'
  }

  const normalizedFullName = fullName.trim()
  if (!FULL_NAME_CHARACTERS.test(normalizedFullName)) {
    return 'Full name can only contain letters and spaces'
  }
  if (!FULL_NAME_CAPITAL_START.test(normalizedFullName)) {
    return 'Full name must start with a capital letter'
  }
  // Every remaining character is a letter or a space at this point.
  if (normalizedFullName.replace(/ /g, '').length < MIN_FULL_NAME_LETTERS) {
    return `Full name must contain at least ${MIN_FULL_NAME_LETTERS} letters`
  }
  return null
}

/** Presence check only — used by login, which must never judge strength. */
function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length === 0) {
    return 'Password is required'
  }
  return null
}

/** Rules for choosing a password at registration. */
function validateNewPassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length === 0) {
    return 'Password is required'
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  }
  return (
    PASSWORD_RULES.find((rule) => !rule.pattern.test(password))?.message ?? null
  )
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
  value === 'docx' ||
  value === 'xlsx'

/** Lowercased text after the last dot, or the whole name when there is none
 * (which `isFileType` then rejects). */
const getFileExtension = (filename: string): string =>
  filename.split('.').pop()?.toLowerCase() ?? ''

/** Largest file a user may upload. Types the optimizer can shrink may exceed
 * the stored cap; every other type has to fit it as uploaded. */
const getMaxUploadBytes = (fileType: FileType): number =>
  OPTIMIZABLE_FILE_TYPES.includes(fileType)
    ? MAX_UPLOAD_FILE_BYTES
    : MAX_STORED_FILE_BYTES

const isScriptFileInput = (value: unknown): value is ScriptFileInput => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ScriptFileInput).fileKey === 'string' &&
    isFileType((value as ScriptFileInput).fileType) &&
    Number.isInteger((value as ScriptFileInput).fileSizeBytes) &&
    (value as ScriptFileInput).fileSizeBytes > 0 &&
    typeof (value as ScriptFileInput).bucket === 'string' &&
    (value as ScriptFileInput).bucket.length > 0 &&
    ((value as ScriptFileInput).fileName === undefined ||
      (value as ScriptFileInput).fileName === null ||
      isStoredFileName((value as ScriptFileInput).fileName))
  )
}

/** Catalog endpoints the Sanity Studio calls. They sit on their own `/api/sanity`
 * surface behind an origin check and a ten-minute access token, never a
 * long-lived secret: see `docs/ARCHITECTURE-ACADEMIC-CATALOG.md`. */
function getDatabaseAcademicEndpoints(entityType: AcademicEntityType) {
  const { sanity } = apiRoutes

  switch (entityType) {
    case 'university':
      return {
        create: sanity.universities,
        sync: (id: string) => sanity.universitiesSyncById(id),
        byId: (id: string) => sanity.universitiesById(id),
      }
    case 'faculty':
      return {
        create: sanity.faculties,
        sync: (id: string) => sanity.facultiesSyncById(id),
        byId: (id: string) => sanity.facultiesById(id),
      }
    case 'study':
      return {
        create: sanity.studies,
        sync: (id: string) => sanity.studiesSyncById(id),
        byId: (id: string) => sanity.studiesById(id),
      }
    case 'subject':
      return {
        create: sanity.subjects,
        sync: (id: string) => sanity.subjectsSyncById(id),
        byId: (id: string) => sanity.subjectsById(id),
      }
    case 'professor':
      return {
        create: sanity.professors,
        sync: (id: string) => sanity.professorsSyncById(id),
        byId: (id: string) => sanity.professorsById(id),
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
  getFileExtension,
  getMaxUploadBytes,
  isAdmin,
  isDisposableEmail,
  isFileType,
  isFlagStatus,
  isFlagTargetType,
  isProfileSubjectStatus,
  isScriptFileInput,
  isUserRole,
  validateEmailAddress,
  validateFullName,
  validateNewPassword,
  validatePassword,
  validateUsername,
}
