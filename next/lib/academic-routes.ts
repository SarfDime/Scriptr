export type AcademicEntityType =
  | 'university'
  | 'faculty'
  | 'subject'
  | 'professor' //TODO: Get these types from sanity

export type AcademicPathInput =
  | { type: 'university'; id: string }
  | { type: 'faculty'; id: string }
  | { type: 'subject'; id: string }
  | { type: 'professor'; id: string }

const cleanEntityId = (id: string): string =>
  id.startsWith('drafts.') ? id.slice('drafts.'.length) : id

export const getUniversityPath = (id: string): string =>
  `/universities/${cleanEntityId(id)}`

export const getFacultyPath = (id: string): string =>
  `/faculties/${cleanEntityId(id)}`

export const getSubjectPath = (id: string): string =>
  `/subjects/${cleanEntityId(id)}`

export const getProfessorPath = (id: string): string =>
  `/professors/${cleanEntityId(id)}`

// TODO: Refactor to use a single function for generating paths based on entity type
export const getAcademicPath = (input: AcademicPathInput): string => {
  const { type, id } = input

  switch (type) {
    case 'university':
      return getUniversityPath(id)
    case 'faculty':
      return getFacultyPath(id)
    case 'subject':
      return getSubjectPath(id)
    case 'professor':
      return getProfessorPath(id)
    default:
      return '/'
  }
}
