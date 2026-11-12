import type { ExamSession } from '@shared/types/academic.types'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { ScriptFile } from '@shared/types/scripts.types'
import type { ReactNode } from 'react'
import type { BoxPropsWithoutChildren } from '@/components/common/Box'
import type { ButtonBaseProps } from '@/components/common/Button'
import type { NextLinkBaseProps } from '@/components/common/NextLink'
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
  /** Address segment of the script's page, so a card links to the canonical
   * URL instead of redirecting through the id. */
  slug: string
  /** The study the script belongs to, whose site owns its page. */
  siteSlug?: string | null
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
  Omit<ButtonBaseProps, 'title'> & {
    title: PortableTextValue
    description?: PortableTextValue
    files: Array<ScriptFile>
  }

export type ScriptSaveButtonProps = BaseScriptAction &
  Omit<ButtonBaseProps, 'children'>

export type ScriptLikeButtonProps = ScriptMeta & {
  likes: number
  iconProps?: Omit<SanityIconProps, 'children'>
  countProps?: Omit<TextProps, 'children'>
} & Omit<ButtonBaseProps, 'children'>

export type ScriptCommentsLinkProps = BaseScriptAction & {
  comments: number
  /** Link target. The id still resolves, but lands through a redirect. */
  slug: string
  /** The owning study's site handle, when the caller knows it. */
  siteSlug?: string | null
} & Omit<NextLinkBaseProps, 'children' | 'href'>

export type ScriptActionsProps = ScriptMeta &
  ScriptStats & {
    /** The script's address segment, so its links stay canonical. */
    slug: string
    /** The owning study's site handle, when the caller knows it. */
    siteSlug?: string | null
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
  /** The read failed, so an empty `scripts` means "unknown", not "none". */
  scriptsUnavailable?: boolean
  title?: string
  subtitle?: string
  parentSubject?: SubjectDetail
  /** Hide the search, the filters and the create action: a short list that
   * only shows the study's own scripts (the study overview's sidebar) has
   * nothing to search or filter. */
  showControls?: {
    all?: boolean
    search?: boolean
    filters?: boolean
    create?: boolean
  }
  /** Copy for an empty list. The default speaks about filters, which is wrong
   * wherever the controls are hidden. */
  emptyMessage?: string

  /** End-aligned header content, e.g. the homepage's feed switch. */
  headerActions?: ReactNode
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
  examSession?: ExamSession | null
  examYear?: number | null
  additionalReading?: Array<string>
  files: Array<File>
}

export type ScriptUploadState =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'optimizing' }
  | { status: 'creating' }
  | { status: 'success'; scriptId: string }
  | { status: 'error'; message: string }
