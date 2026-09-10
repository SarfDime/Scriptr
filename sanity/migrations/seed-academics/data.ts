export type SeedPerson = {
  id: string
  name: string
  title: string
  description?: string
  imageUrl?: string
}

export type SeedUniversity = {
  id: string
  name: string
  description?: string
  streetAddress: string
  telephone?: string
  email?: string
  website: string
  rectorId?: string // -> SeedPerson.id
  viceRectorIds?: Array<string> // -> SeedPerson.id[]
}

export type SeedFaculty = {
  id: string
  name: string
  description?: string
  deanId: string // -> SeedPerson.id
  secretaryId: string // -> SeedPerson.id
  viceDeanIds?: Array<string> // -> SeedPerson.id[]
  streetAddress: string
  telephone: string
  email: string
  website: string
  universityId: string // -> SeedUniversity.id
}

export type SeedProfessor = {
  id: string
  name: string
  title?: string
  bio?: string
  office?: string
  telephone?: string
  email?: string
  website: string
  facultyIds: Array<string> // -> SeedFaculty.id[]
  imageUrl?: string
}

export type SeedSubject = {
  id: string
  name: string
  code?: string
  description?: string
  credits?: number
  syllabus: string
  year: number
  semester?: 'winter' | 'summer'
  examSession: 'january' | 'june' | 'september'
  professorIds: Array<string> // -> SeedProfessor.id[]
  facultyId: string // -> SeedFaculty.id
}

// --- Sample data — replace with the real seed set ---

export const persons: Array<SeedPerson> = [
  {
    id: 'person-jane-doe',
    name: 'Jane Doe',
    title: 'Professor',
    description: 'Dean of the faculty.',
  },
]

export const universities: Array<SeedUniversity> = [
  {
    id: 'university-example',
    name: 'Example University',
    streetAddress: '1 Example Street',
    website: 'https://example.edu',
  },
]

export const faculties: Array<SeedFaculty> = [
  {
    id: 'faculty-computer-science',
    name: 'Faculty of Computer Science',
    deanId: 'person-jane-doe',
    secretaryId: 'person-jane-doe',
    streetAddress: '1 Example Street',
    telephone: '+1 555 0100',
    email: 'cs@example.edu',
    website: 'https://cs.example.edu',
    universityId: 'university-example',
  },
]

export const professors: Array<SeedProfessor> = []

export const subjects: Array<SeedSubject> = [
  {
    id: 'subject-algorithms',
    name: 'Algorithms',
    syllabus: 'Introductory algorithms and data structures.',
    year: 2,
    examSession: 'june',
    professorIds: ['professor-jane-doe'],
    facultyId: 'faculty-computer-science',
  },
]
