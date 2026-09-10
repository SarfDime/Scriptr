import type { BoxProps } from '@/components/common/Box'
import type { ButtonProps } from '@/components/common/Button'
import type { NextLinkProps } from '@/components/common/NextLink'
import type { TextProps } from '@/components/typography/Text'
import type { MinimalSubject } from '../academics/subject.types'
import type { SanityIconProps } from '../component.types'
import type { ComponentColorPalettes } from './ColorPalettes.types'
import type { PortableTextType } from './PortableText.types'

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
  scriptTitle: string
}

type BaseScript = ScriptId &
  ScriptStats & {
    title: string
    subject: string
    tag?: string
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

export type ScriptDownloadButtonProps = ScriptId &
  ButtonProps & {
    iconProps?: SanityIconProps
  }

export type ScriptPreviewButtonProps = ScriptId & ButtonProps

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

export type ScriptActionsProps = BoxProps &
  ScriptMeta &
  ScriptStats & {
    className?: string
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
}

export type ScriptsSectionProps = Omit<BoxProps, 'content' | 'as'> &
  ScriptFiltersProps & {
    content: PortableTextType
    scripts: Array<Script>
    savedIds: Array<ScriptId>
    likedIds: Array<ScriptId>
    onToggleSaved: (id: ScriptId) => void
    onToggleLiked: (id: ScriptId) => void
  }

export type PageDataProps = {
  scripts?: Array<Script>
  subjects?: Array<MinimalSubject>
  greeting?: string
  authoredCount?: number
  commentCount?: number
  activityContent?: PortableTextType
}
