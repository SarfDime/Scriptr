export type AcademicEntityType =
  | 'university'
  | 'faculty'
  | 'subject'
  | 'professor'

/**
 * Generates the canonical subroute path for an academic entity using its document ID.
 */
export const getAcademicEntityPath = (
  entityType: AcademicEntityType,
  id: string
): string => {
  const cleanId = id.startsWith('drafts.') ? id.slice('drafts.'.length) : id

  switch (entityType) {
    case 'university':
      return `/universities/${cleanId}`
    case 'faculty':
      return `/faculties/${cleanId}`
    case 'subject':
      return `/subjects/${cleanId}`
    case 'professor':
      return `/professors/${cleanId}`
    default:
      return '/'
  }
}

export const getUniversityPath = (id: string): string =>
  getAcademicEntityPath('university', id)

export const getFacultyPath = (id: string): string =>
  getAcademicEntityPath('faculty', id)

export const getSubjectPath = (id: string): string =>
  getAcademicEntityPath('subject', id)

export const getProfessorPath = (id: string): string =>
  getAcademicEntityPath('professor', id)
