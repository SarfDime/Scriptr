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

const isUserRole = (value: unknown): value is UserRole =>
  value === 'student' || value === 'moderator' || value === 'admin'

function isAdmin(role: unknown): boolean {
  return role === 'admin'
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
  isFileType,
  isFlagStatus,
  isFlagTargetType,
  isProfileSubjectStatus,
  isScriptFileInput,
  isUserRole,
}
