import type { SanityImageType } from '../common.types'
import type { PortableTextType } from '../components/PortableText.types'
import type {
  ContactInfo,
  MinimalEntity,
  RelatedFaculty,
} from './academics.types'
import type { FacultyDetail } from './faculty.types'
import type { MinimalSubject } from './subject.types'

type MinimalProfessor = MinimalEntity & {
  title?: string
  picture?: SanityImageType
  faculties?: Array<Pick<MinimalEntity, '_id' | 'name'>>
  universities?: Array<MinimalEntity>
  subjects?: Array<Pick<MinimalSubject, '_id' | 'name' | 'code'>>
}

type ProfessorDetail = Omit<MinimalProfessor, 'faculties' | 'subjects'> &
  ContactInfo & {
    _type: 'professor'
    bio?: PortableTextType
    office?: string
    faculties?: Array<RelatedFaculty>
    subjects?: Array<
      Pick<MinimalSubject, '_id' | 'name' | 'year' | 'code' | 'credits'> & {
        dbId?: string
        faculty?: MinimalEntity
      }
    >
  }

type ProfessorsSectionProps = {
  professors: FacultyDetail['professors']
}

export type { MinimalProfessor, ProfessorDetail, ProfessorsSectionProps }
