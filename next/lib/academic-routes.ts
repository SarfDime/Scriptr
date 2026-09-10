export type AcademicEntityType =
  | 'university'
  | 'faculty'
  | 'subject'
  | 'professor' //TODO: Get these types from sanity types
  | 'script'

export type AcademicPathInput = { type: AcademicEntityType; id: string }

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
    case 'script':
      return `/scripts/${cleanEntityId(id)}`
    default:
      return '/'
  }
}
