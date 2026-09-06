import type { BoxProps } from '@/components/common/Box'
import type { ComponentColorPalettes } from '../component.types'
import type { PortableTextType } from './PortableText.types'

export type SubjectId = string

export type Subject = {
  id?: SubjectId
  name: string
  code: string
  next: string
  progress: number
  color: ComponentColorPalettes
}

export type SubjectCardProps = {
  subject: Subject
}

export type SubjectsSidebarProps = {
  subjects: Array<Subject>
  content: PortableTextType
} & Omit<BoxProps, 'content' | 'as'>
