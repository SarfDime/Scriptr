import type {
  FileType,
  ProfileSubject,
  ProfileSubjectStatus,
} from '@shared/types/api.types'
import type { ComponentColorPalettes } from '../component.types'
import type { PortableTextType } from './PortableText.types'
import type { Subject } from './Subjects.types'

export type { FileType, ProfileSubject, ProfileSubjectStatus }

export type ScriptId = string
export type SortOption = 'Recently updated' | 'Title A-Z'

export type Script = {
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

export type PageDataProps = {
  scripts?: Array<Script>
  subjects?: Array<Subject>
  greeting?: string
  authoredCount?: number
  commentCount?: number
  activityContent?: PortableTextType
}

export type ScriptCardProps = {
  script: Script
  isSaved: boolean
  isLiked: boolean
  onToggleSaved: (id: ScriptId) => void
  onToggleLiked: (id: ScriptId) => void
}

export type ScriptFiltersProps = {
  subject: string
  subjects: Array<string>
  sort: SortOption
  onSubjectChange: (value: string) => void
  onSortChange: (value: SortOption) => void
}

export type ScriptsSectionProps = {
  content: PortableTextType
  scripts: Array<Script>
  subjectOptions: Array<string>
  subject: string
  sort: SortOption
  onSubjectChange: (value: string) => void
  onSortChange: (value: SortOption) => void
  savedIds: Array<ScriptId>
  likedIds: Array<ScriptId>
  onToggleSaved: (id: ScriptId) => void
  onToggleLiked: (id: ScriptId) => void
}

export type SearchHeaderProps = {
  greeting: string
  query: string
  onQueryChange: (value: string) => void
}
