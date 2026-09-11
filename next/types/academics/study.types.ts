import type { BoxProps } from '@/components/common/Box'
import type { SanityImageType } from '../common.types'
import type { PersonSummary } from '../components/Person.types'
import type { PortableTextType } from '../components/PortableText.types'
import type {
  AddressableContactInfo,
  MinimalEntity,
  RelatedFaculty,
} from './academics.types'
import type { MinimalProfessor } from './professor.types'
import type { MinimalSubject } from './subject.types'

type MinimalStudy = MinimalEntity & {
  picture?: SanityImageType
  studentCount?: number
  subjectCount?: number
  assistant?: PersonSummary
  professorCount?: number

  faculty?: RelatedFaculty
  professors?: Array<MinimalProfessor>
  subjects?: Array<MinimalSubject>
}

type StudyDetail = Omit<MinimalStudy, 'subjectCount' | 'professorCount'> &
  AddressableContactInfo & {
    _type: 'study'
    description?: PortableTextType
  }

type StudyOverviewCardProps = {
  study: StudyDetail
} & BoxProps

export type { MinimalStudy, StudyDetail, StudyOverviewCardProps }
