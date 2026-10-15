import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { ScriptFile } from '@shared/types/scripts.types'
import type { BoxPropsWithoutChildren } from '@/components/common/Box'
import type { ButtonProps } from '@/components/common/Button'
import type { NextLinkProps } from '@/components/common/NextLink'
import type { TextProps } from '@/components/typography/Text'
import type { MinimalSubject, SubjectDetail } from '../academics/subject.types'
import type { SanityIconProps } from '../component.types'
import type { ComponentColorPalettes } from './ColorPalettes.types'

// -----------------------------------------------------------------------------
// Base Primitives & Shared Traits
// -----------------------------------------------------------------------------

export type ScriptId = {
  id: string
}

export type ScriptStats = {
  likes: number
  comments: number
}

export type ScriptMeta = ScriptId & {
  scriptTitle: PortableTextValue
}

type BaseScript = ScriptId &
  ScriptStats & {
    title: PortableTextValue
    description?: PortableTextValue
    subject: string
    tag?: string
    files?: Array<ScriptFile>
  }

type BaseScriptAction = ScriptMeta & {
  iconProps?: SanityIconProps
}

// -----------------------------------------------------------------------------
// Domain Models
// -----------------------------------------------------------------------------

export type Script = BaseScript & {
  professor: string
  year: string
  color: ComponentColorPalettes
  saved: boolean
  liked: boolean
  author?: string
  updated?: string
}

export type ScriptDetail = BaseScript & {
  author: string
  professor?: string
  year?: number
  updatedAt: Date
}

// -----------------------------------------------------------------------------
// Filters & Control Types
// -----------------------------------------------------------------------------

export type ScriptSortOption = 'Recently updated' | 'Title A-Z'

export type ScriptFiltersProps = {
  subject: string
  subjects: Array<string>
  sort: ScriptSortOption
  onSubjectChange: (value: string) => void
  onSortChange: (value: ScriptSortOption) => void
}

// -----------------------------------------------------------------------------
// Action Components & Buttons
// -----------------------------------------------------------------------------

export type ScriptPreviewButtonProps = ScriptId &
  Omit<ButtonProps, 'title'> & {
    title: PortableTextValue
    description?: PortableTextValue
    files: Array<ScriptFile>
  }

export type ScriptSaveButtonProps = BaseScriptAction &
  Omit<ButtonProps, 'children'>

export type ScriptLikeButtonProps = ScriptMeta & {
  likes: number
  iconProps?: Omit<SanityIconProps, 'children'>
  countProps?: Omit<TextProps, 'children'>
} & Omit<ButtonProps, 'children'>

export type ScriptCommentsLinkProps = BaseScriptAction & {
  comments: number
} & Omit<NextLinkProps, 'children' | 'href'>

export type ScriptActionsProps = ScriptMeta &
  ScriptStats & {
    title: PortableTextValue
    description?: PortableTextValue
    files: Array<ScriptFile>
    saveButtonProps?: ScriptSaveButtonProps
    likeButtonProps?: ScriptLikeButtonProps
    commentsLinkProps?: ScriptCommentsLinkProps
    previewButtonProps?: ScriptPreviewButtonProps
  }

// -----------------------------------------------------------------------------
// Page & Container Props
// -----------------------------------------------------------------------------

export type ScriptCardProps = {
  script: ScriptDetail
} & BoxPropsWithoutChildren

export type ScriptsSectionProps = {
  scripts: Array<ScriptDetail>
  title?: string
  subtitle?: string
  parentSubject?: SubjectDetail
  /** Shows a link to the site-wide `/search` once a query is typed, since the
   * local filter only covers the scripts already loaded. */
  showGlobalSearch?: boolean
} & BoxPropsWithoutChildren

export type PageDataProps = {
  scripts?: Array<Script>
  subjects?: Array<MinimalSubject>
  greeting?: string
  authoredCount?: number
  commentCount?: number
  activityContent?: PortableTextValue
}

/*
 * Script Upload Types
 */

export type ScriptUploadInput = {
  title: PortableTextValue
  description?: PortableTextValue
  subjectId: string
  professorId: string
  examSession?: string | null
  additionalReading?: Array<string>
  files: Array<File>
}

export type ScriptUploadState =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'creating' }
  | { status: 'success'; scriptId: string }
  | { status: 'error'; message: string }
