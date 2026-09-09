import type { SanityImageType } from '../common.types'
import type { PersonSummary } from '../components/Person.types'
import type { PortableTextType } from '../components/PortableText.types'
import type { AddressableContactInfo, MinimalEntity } from './academics.types'
import type { MinimalProfessor } from './professor.types'
import type { MinimalSubject } from './subject.types'

export type MinimalFaculty = MinimalEntity & {
  picture?: SanityImageType
  studentCount?: number
  subjectCount?: number
  professorCount?: number

  dean?: PersonSummary
  university?: MinimalEntity
  professors?: Array<MinimalProfessor>
  subjects?: Array<MinimalSubject>
}

export type FacultyDetail = Omit<
  MinimalFaculty,
  'subjectCount' | 'professorCount'
> &
  AddressableContactInfo & {
    _type: 'faculty'
    description?: PortableTextType
    secretary?: PersonSummary
    viceDeans?: Array<PersonSummary>
  }
