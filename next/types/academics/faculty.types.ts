import type { BoxProps } from '@/components/common/Box'
import type { SanityImageType } from '../common.types'
import type { PersonSummary } from '../components/Person.types'
import type { PortableTextType } from '../components/PortableText.types'
import type { AddressableContactInfo, MinimalEntity } from './academics.types'
import type { MinimalProfessor } from './professor.types'
import type { MinimalStudy } from './study.types'

type MinimalFaculty = MinimalEntity & {
  picture?: SanityImageType
  studentCount?: number
  studyCount?: number
  professorCount?: number

  dean?: PersonSummary
  university?: MinimalEntity
  professors?: Array<MinimalProfessor>
  studies?: Array<MinimalStudy>
}

type FacultyDetail = Omit<MinimalFaculty, 'studyCount' | 'professorCount'> &
  AddressableContactInfo & {
    _type: 'faculty'
    description?: PortableTextType
    secretary?: PersonSummary
    viceDeans?: Array<PersonSummary>
  }

type FacultyOverviewCardProps = {
  faculty: FacultyDetail
} & BoxProps

export type { FacultyDetail, FacultyOverviewCardProps, MinimalFaculty }
