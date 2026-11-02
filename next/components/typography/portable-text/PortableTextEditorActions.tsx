'use client'

import { PT_STRINGS } from '@shared/config/pt-strings'
import type { ReactNode } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import {
  ConfirmAction,
  type ConfirmActionProps,
} from '@/components/ui/ConfirmAction'
import { cn } from '@/lib/common-utils'
import type { PortableTextEditorActionsProps } from '@/types/components/PortableTextEditor.types'

const ACTION_DEFAULT_CLASS = 'button button-md'

type GuardedProps = Omit<ConfirmActionProps, 'trigger' | 'title'> & {
  title: string
  /** When false the action runs straight away. Defaults to true. */
  confirm?: boolean
  /** Runs before the confirmation opens; returning false stops it. */
  beforeConfirm?: () => boolean
  children: (trigger: () => void) => ReactNode
}

/** Puts an action behind a confirmation unless `confirm` is false. */
const Guarded = ({
  confirm = true,
  beforeConfirm,
  children,
  onConfirm,
  ...confirmProps
}: GuardedProps) => {
  if (!confirm) return <>{children(onConfirm)}</>
  return (
    <ConfirmAction
      {...confirmProps}
      onConfirm={onConfirm}
      trigger={(open) =>
        children(() => {
          if (!beforeConfirm || beforeConfirm()) open()
        })
      }
    />
  )
}

/** The action row of a Portable Text editor. Purely presentational: it
 * renders the requested actions and reports clicks, so the editor owns every
 * behaviour. */
export const PortableTextEditorActions = ({
  actions,
  labels,
  hasContent,
  isPending,
  isPreviewing,
  confirmCancel,
  onSaveAttempt,
  meta,
  onClear,
  onPreview,
  onCancel,
  onSave,
}: PortableTextEditorActionsProps) => {
  const has = (action: (typeof actions)[number]) => actions.includes(action)
  const cancelLabel = labels?.cancel ?? PT_STRINGS.editor.cancel
  const previewLabel = isPreviewing
    ? (labels?.hidePreview ?? PT_STRINGS.editor.hidePreview)
    : (labels?.preview ?? PT_STRINGS.editor.preview)

  if (actions.length === 0 && !meta) return null

  return (
    <Box className='ui-cluster justify-between gap-x-3 gap-y-2'>
      <Box className='ui-stack gap-1'>{meta}</Box>
      <Box className='ui-cluster justify-end gap-2'>
        {has('clear') && (
          <Guarded
            title={PT_STRINGS.editor.clearTitle}
            description={PT_STRINGS.editor.clearDescription}
            confirmLabel={PT_STRINGS.editor.clearConfirm}
            cancelLabel={PT_STRINGS.editor.keepEditing}
            onConfirm={onClear}
          >
            {(trigger) => (
              <Button
                onClick={trigger}
                disabled={!hasContent || isPending}
                className={cn(ACTION_DEFAULT_CLASS, 'danger')}
              >
                {labels?.clear ?? PT_STRINGS.editor.clear}
              </Button>
            )}
          </Guarded>
        )}
        {has('preview') && (
          <Button
            onClick={onPreview}
            disabled={!hasContent}
            isActive={isPreviewing}
            aria-pressed={isPreviewing}
            className={cn(ACTION_DEFAULT_CLASS, 'ghost')}
          >
            {previewLabel}
          </Button>
        )}
        {has('cancel') && (
          <Guarded
            confirm={confirmCancel}
            title={PT_STRINGS.editor.discardTitle}
            description={PT_STRINGS.editor.discardDescription}
            confirmLabel={PT_STRINGS.editor.discardConfirm}
            cancelLabel={PT_STRINGS.editor.keepEditing}
            onConfirm={onCancel}
          >
            {(trigger) => (
              <Button
                onClick={trigger}
                disabled={isPending}
                className={cn(ACTION_DEFAULT_CLASS, 'cp-warning-int')}
              >
                {cancelLabel}
              </Button>
            )}
          </Guarded>
        )}
        {has('save') && (
          <Guarded
            beforeConfirm={onSaveAttempt}
            title={PT_STRINGS.editor.saveTitle}
            description={PT_STRINGS.editor.saveDescription}
            confirmLabel={labels?.save ?? PT_STRINGS.editor.save}
            cancelLabel={PT_STRINGS.editor.keepEditing}
            destructive={false}
            onConfirm={onSave}
          >
            {(trigger) => (
              <Button
                onClick={trigger}
                disabled={isPending}
                className={cn(ACTION_DEFAULT_CLASS, 'solid')}
              >
                {labels?.save ?? PT_STRINGS.editor.save}
              </Button>
            )}
          </Guarded>
        )}
      </Box>
    </Box>
  )
}
