import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { ReactNode } from 'react'
import type { PortableTextEditorOptions } from '@/components/typography/portable-text/toolbar/schema'

export type PortableTextEditorAction = 'clear' | 'preview' | 'cancel' | 'save'

export type PortableTextEditorActionLabels = Partial<
  Record<PortableTextEditorAction | 'hidePreview', string>
>

export type PortableTextEditorActionsProps = {
  /** Which actions to render. They always appear in the fixed order
   * clear, preview, cancel, save. */
  actions: ReadonlyArray<PortableTextEditorAction>
  labels?: PortableTextEditorActionLabels
  hasContent: boolean
  isPending: boolean
  isPreviewing: boolean
  /** Ask for confirmation before cancelling. */
  confirmCancel: boolean
  /** Validates before the save confirmation opens; false blocks it. */
  onSaveAttempt: () => boolean
  /** Rendered at the start of the row, e.g. a character count. */
  meta?: ReactNode
  onClear: () => void
  onPreview: () => void
  onCancel: () => void
  onSave: () => void
}

export type PortableTextEditorSectionProps = {
  initialContent?: PortableTextValue
  actions?: ReadonlyArray<PortableTextEditorAction>
  actionLabels?: PortableTextEditorActionLabels
  /** Persists the draft. Resolve `false` when the save failed (the caller has
   * already reported it); throw to have the section toast a generic failure. */
  onSave?: (value: PortableTextValue) => Promise<boolean>
  onSaveSuccess?: () => void
  onCancel?: () => void
  onChange?: (value: PortableTextValue) => void
  /** Ask for confirmation before cancelling once there is content. */
  confirmCancelWhenDirty?: boolean
  /** Returns a message to toast and block saving, or `null` when valid. */
  validate?: (value: PortableTextValue) => string | null
  renderMeta?: (value: PortableTextValue) => ReactNode
  ariaLabel?: string
  autoFocus?: boolean
  editorOptions?: PortableTextEditorOptions
  editorClassName?: string
  editorContainerClassName?: string
  singleLine?: boolean
}
