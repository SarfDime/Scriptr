import {
  ADMIN_PROFILE_SORT_OPTIONS,
  ADMIN_PROFILES_MAX_PAGE_SIZE,
  ADMIN_PROFILES_PAGE_SIZE,
  type AdminProfileSortField,
} from '../../../shared/config/shared-constants'
import type { UserRole } from '../../../shared/types/profile.types'
import { isUserRole } from '../../../shared/utils/api.utils'
import type { SortDirection } from '../../../shared/utils/array-utils/sort'

/** The columns the admin listing and the admin detail read share. */
export const ADMIN_PROFILE_COLUMNS =
  'id, username, full_name, role, avatar_url, created_at, updated_at'

/** One listing row with the selections the management table shows. The
 * faculties/studies embeds are to-one rows, so each row wraps one joined
 * object; PostgREST nests it under the table name. */
export const ADMIN_PROFILES_SELECT = `${ADMIN_PROFILE_COLUMNS},
  subjects:profile_subjects(subject_id, status, updated_at),
  faculties:profile_faculties(faculty:faculties(id, name)),
  studies:profile_studies(study:studies(id, name))`

export type AdminProfilesQueryParams = {
  limit: number
  offset: number
  role: UserRole | null
  /** An `ilike` pattern, already stripped of the characters PostgREST's `or`
   * filter grammar reserves, or `null` when no search was asked for. */
  searchPattern: string | null
  sort: AdminProfileSortField
  order: SortDirection
}

const isAdminProfileSortField = (
  value: string
): value is AdminProfileSortField =>
  ADMIN_PROFILE_SORT_OPTIONS.some((field) => field === value)

/** Turns a search term into an `ilike` pattern, minus the characters
 * PostgREST's `or` filter grammar reserves (`,` `(` `)` and quotes) and the
 * `ilike` wildcards. A term made only of those becomes no filter at all. */
export const toAdminProfileSearchPattern = (value: string) => {
  const cleaned = value.replace(/[,()"\\%_]/g, ' ').trim()
  return cleaned ? `%${cleaned}%` : null
}

/**
 * Validates the admin listing's query string. `get` is the route's
 * `c.req.query`, so the parsing can be unit-tested without a request.
 *
 * `null` means the caller asked for a page, role or ordering this route cannot
 * honour, which the route answers with a `400` rather than silently
 * substituting a default.
 */
export function parseAdminProfilesQuery(
  get: (name: string) => string | undefined
): AdminProfilesQueryParams | null {
  const rawLimit = get('limit')
  const rawOffset = get('offset')
  const limit =
    rawLimit === undefined ? ADMIN_PROFILES_PAGE_SIZE : Number(rawLimit)
  const offset = rawOffset === undefined ? 0 : Number(rawOffset)

  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > ADMIN_PROFILES_MAX_PAGE_SIZE ||
    !Number.isSafeInteger(offset) ||
    offset < 0
  ) {
    return null
  }

  const rawRole = get('role')
  if (rawRole && !isUserRole(rawRole)) return null

  const rawSort = get('sort') ?? 'created_at'
  if (!isAdminProfileSortField(rawSort)) return null

  const rawOrder = get('order') ?? 'desc'
  if (rawOrder !== 'asc' && rawOrder !== 'desc') return null

  return {
    limit,
    offset,
    role: rawRole ? (rawRole as UserRole) : null,
    searchPattern: toAdminProfileSearchPattern(get('search') ?? ''),
    sort: rawSort,
    order: rawOrder,
  }
}
