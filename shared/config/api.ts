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

const QUERY_CONFIG: Record<string, { args: string; paramsObj: string }> = {
  '/api/scripts/top': { args: 'limit?: number', paramsObj: '{ limit }' },
  '/api/scripts/popular': { args: 'limit?: number', paramsObj: '{ limit }' },
  '/api/scripts/search': { args: 'query: string', paramsObj: '{ q: query }' },
  '/api/ratings/types': {
    args: 'target_type: RatingTargetType',
    paramsObj: '{ target_type: target_type }',
  },
}

export { ACADEMIC_TYPES, API_BASE_PATH, QUERY_CONFIG, STEP_ORDER }
