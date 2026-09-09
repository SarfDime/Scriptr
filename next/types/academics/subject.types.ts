import type { BoxProps } from '@/components/common/Box'
import type { PortableTextType } from '../components/PortableText.types'
import type { MinimalEntity, RelatedFaculty } from './academics.types'
import type { MinimalProfessor, ProfessorDetail } from './professor.types'

export type SubjectExamSession = 'january' | 'june' | 'september'
export type SubjectSemester = 'winter' | 'summer'

export type MinimalSubject = MinimalEntity & {
  year: number
  code?: string
  credits?: number
  semester?: SubjectSemester
  faculty?: Pick<RelatedFaculty, '_id' | 'name' | 'university'>
  professors?: Array<Pick<MinimalProfessor, '_id' | 'name' | 'title'>>
}

export type SubjectDetail = Omit<MinimalSubject, 'professors' | 'faculty'> & {
  _type: 'subject'
  description?: PortableTextType
  syllabus?: string
  faculty?: RelatedFaculty
  professors?: Array<
    Pick<
      ProfessorDetail,
      '_id' | 'name' | 'dbId' | 'title' | 'picture' | 'email'
    >
  >
}

export type SubjectsSidebarProps = Omit<BoxProps, 'content' | 'as'> & {
  subjects: Array<MinimalSubject>
  content: PortableTextType
}
