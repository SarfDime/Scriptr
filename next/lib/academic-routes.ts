export type AcademicPathInput =
  | { type: 'university'; universitySlug: string }
  | { type: 'faculty'; universitySlug: string; facultySlug: string }
  | {
      type: 'study'
      universitySlug: string
      facultySlug: string
      studySlug: string
    }
  | {
      type: 'subject'
      universitySlug: string
      facultySlug: string
      studySlug: string
      subjectSlug: string
    }
  | { type: 'professor'; professorSlug: string }
  | { type: 'script'; scriptSlug: string } // Deferred: derive these types from Sanity.

const cleanEntityId = (id: string): string =>
  id.startsWith('drafts.') ? id.slice('drafts.'.length) : id

export const getAcademicPath = (input: AcademicPathInput): string => {
  switch (input.type) {
    case 'university':
      return `/university/${cleanEntityId(input.universitySlug)}`
    case 'faculty':
      return `/university/${cleanEntityId(input.universitySlug)}/faculty/${cleanEntityId(input.facultySlug)}`
    case 'study':
      return `/university/${cleanEntityId(input.universitySlug)}/faculty/${cleanEntityId(input.facultySlug)}/study/${cleanEntityId(input.studySlug)}`
    case 'subject':
      return `/university/${cleanEntityId(input.universitySlug)}/faculty/${cleanEntityId(input.facultySlug)}/study/${cleanEntityId(input.studySlug)}/subject/${cleanEntityId(input.subjectSlug)}`
    case 'professor':
      return `/professor/${cleanEntityId(input.professorSlug)}`
    case 'script':
      return `/scripts/${cleanEntityId(input.scriptSlug)}`
    default:
      return '/'
  }
}
