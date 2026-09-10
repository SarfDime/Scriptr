import type { BoxProps } from '@/components/common/Box'
import type { MinimalSubject } from '../academics/subject.types'
import type { ComponentColorPalettes } from '../component.types'
import type { PortableTextType } from './PortableText.types'

type ScriptId = string

type Script = {
  id: ScriptId
  title: string
  subject: string
  professor: string
  author?: string
  year: string
  updated?: string
  tag?: string
  color: ComponentColorPalettes
  likes: number
  comments: number
  saved: boolean
  liked: boolean
}

type PageDataProps = {
  scripts?: Array<Script>
  subjects?: Array<MinimalSubject>
  greeting?: string
  authoredCount?: number
  commentCount?: number
  activityContent?: PortableTextType
}

type ScriptSortOption = 'Recently updated' | 'Title A-Z'

type ScriptsSectionProps = {
  content: PortableTextType
  scripts: Array<Script>
  subjectOptions: Array<string>
  subject: string
  sort: ScriptSortOption
  onSubjectChange: (value: string) => void
  onSortChange: (value: ScriptSortOption) => void
  savedIds: Array<ScriptId>
  likedIds: Array<ScriptId>
  onToggleSaved: (id: ScriptId) => void
  onToggleLiked: (id: ScriptId) => void
} & Omit<BoxProps, 'content' | 'as'>

type SearchHeaderProps = {
  greeting: string
  query: string
  onQueryChange: (value: string) => void
}

type ScriptDetail = {
  id: string
  title: string
  tag?: string
  subject: string
  professor?: string
  year?: number
  author: string
  updatedAt: Date
  likes: number
  comments: number
}

type ScriptCardProps = {
  script: ScriptDetail
}

type ScriptFiltersProps = {
  subject: string
  subjects: Array<string>
  sort: ScriptSortOption
  onSubjectChange: (value: string) => void
  onSortChange: (value: ScriptSortOption) => void
}

export type {
  PageDataProps,
  Script,
  ScriptCardProps,
  ScriptDetail,
  ScriptFiltersProps,
  ScriptId,
  ScriptSortOption,
  ScriptsSectionProps,
  SearchHeaderProps,
}
