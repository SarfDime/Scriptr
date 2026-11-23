const ACADEMIC_TYPES = [
  'university',
  'faculty',
  'professor',
  'subject',
  'study',
] as const

export type AcademicEntityType = (typeof ACADEMIC_TYPES)[number]

const STEP_ORDER: Array<'selection' | 'account'> = [
  'selection',
  'account',
] as const

export type RatingTargetType = 'professor' | 'subject'

const API_BASE_PATH = '/api'

/**
 * The `code` a study-scoped `403` body carries when the caller is not part of
 * the study they are writing to — a different refusal from a restricted account,
 * which the client answers with setup rather than the restriction notice.
 */
const STUDY_JOIN_REQUIRED_CODE = 'study_join_required'

const QUERY_CONFIG: Record<string, { args: string; paramsObj: string }> = {
  '/api/scripts/top': { args: 'limit?: number', paramsObj: '{ limit }' },
  '/api/scripts/popular': { args: 'limit?: number', paramsObj: '{ limit }' },
  '/api/scripts/search': {
    args: 'query: string, study?: string',
    paramsObj: '{ q: query, study }',
  },
  '/api/ratings/types': {
    args: 'target_type: RatingTargetType',
    paramsObj: '{ target_type: target_type }',
  },
}

export {
  ACADEMIC_TYPES,
  API_BASE_PATH,
  QUERY_CONFIG,
  STEP_ORDER,
  STUDY_JOIN_REQUIRED_CODE,
}
