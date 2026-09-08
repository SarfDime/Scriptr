import type { PortableTextType } from './components/PortableText.types'

/** Props shared by every academic detail route (`/universities/[slug]`, `/faculties/[slug]`, etc). */
export type AcademicDetailPageProps = {
  params: Promise<{ slug: string }>
}

export type PersonSummary = {
  _id: string
  name: string
  title?: string
  image?: unknown
}

export type MinimalEntity = {
  _id: string
  name: string
  dbId?: string
}

export type FacultyListingItem = {
  _id: string
  name: string
  dbId?: string
}

export type UniversityListingItem = {
  _id: string
  name: string
  dbId?: string
  faculties?: Array<FacultyListingItem>
}

export type UniversityGalleryData = Array<UniversityListingItem>

export type FacultySummaryInUniversity = {
  _id: string
  name: string
  dbId?: string
  email?: string
  telephone?: string
  website?: string
  subjectCount?: number
  professorCount?: number
}

export type UniversityDetail = {
  _id: string
  _type: 'university'
  name: string
  dbId?: string
  description?: PortableTextType
  streetAddress?: string
  telephone?: string
  email?: string
  website?: string
  rector?: PersonSummary
  viceRectors?: Array<PersonSummary>
  faculties?: Array<FacultySummaryInUniversity>
}

export type ProfessorSummaryInFaculty = {
  _id: string
  name: string
  dbId?: string
  title?: string
  picture?: unknown
  email?: string
  office?: string
}

export type SubjectSummaryInFaculty = {
  _id: string
  name: string
  dbId?: string
  year: number
  examSession: string
  code?: string
  credits?: number
  semester?: string
}

export type FacultyDetail = {
  _id: string
  _type: 'faculty'
  name: string
  dbId?: string
  description?: PortableTextType
  secretary?: string
  streetAddress?: string
  telephone?: string
  email?: string
  website?: string
  dean?: PersonSummary
  viceDeans?: Array<PersonSummary>
  university?: MinimalEntity
  professors?: Array<ProfessorSummaryInFaculty>
  subjects?: Array<SubjectSummaryInFaculty>
}

export type SubjectDetail = {
  _id: string
  _type: 'subject'
  name: string
  dbId?: string
  code?: string
  credits?: number
  year: number
  semester?: string
  examSession: string
  description?: PortableTextType
  syllabus?: string
  faculty?: {
    _id: string
    name: string
    dbId?: string
    university?: MinimalEntity
  }
  professors?: Array<{
    _id: string
    name: string
    dbId?: string
    title?: string
    picture?: unknown
    email?: string
  }>
}

export type ProfessorDetail = {
  _id: string
  _type: 'professor'
  name: string
  dbId?: string
  title?: string
  bio?: PortableTextType
  picture?: unknown
  office?: string
  telephone?: string
  email?: string
  website?: string
  faculties?: Array<{
    _id: string
    name: string
    dbId?: string
    university?: MinimalEntity
  }>
  subjects?: Array<{
    _id: string
    name: string
    dbId?: string
    year: number
    examSession: string
    code?: string
    credits?: number
    faculty?: MinimalEntity
  }>
}
