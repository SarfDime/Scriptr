import type { BoxProps } from '@/components/common/Box'
import type { PortableTextType } from '../components/PortableText.types'
import type { MinimalEntity, RelatedStudy } from './academics.types'
import type { MinimalProfessor, ProfessorDetail } from './professor.types'

export type SubjectExamSession = 'january' | 'june' | 'september'
export type SubjectSemester = 'winter' | 'summer'

export type SubjectBasicInfo = {
  year: number
  code?: string
  credits?: number
  semester?: SubjectSemester
}

export type MinimalSubject = MinimalEntity & {
  study?: RelatedStudy
  professors?: Array<Pick<MinimalProfessor, '_id' | 'name' | 'title'>>
} & SubjectBasicInfo

export type SubjectDetail = Omit<MinimalSubject, 'professors' | 'study'> & {
  _type: 'subject'
  description?: PortableTextType
  syllabus?: string
  study?: RelatedStudy

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
