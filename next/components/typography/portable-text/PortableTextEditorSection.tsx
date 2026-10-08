'use client'

import { EditorProvider, PortableTextEditable } from '@portabletext/editor'
import { EventListenerPlugin, NodePlugin } from '@portabletext/editor/plugins'
import { PT_STRINGS } from '@shared/config/pt-strings'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import { generateRandomKey } from '@shared/utils/common-utils'
import { useState, useTransition } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { cn } from '@/lib/common-utils'
import { ClearOtherDecorators } from './toolbar/PTClearOtherDecorators'
import { Toolbar } from './toolbar/PTToolbar'
import {
  createPortableTextEditorConfig,
  type PortableTextEditorOptions,
} from './toolbar/schema'

export type PortableTextEditorSectionProps = {
  initialContent?: PortableTextValue
  onSave?: (value: PortableTextValue) => Promise<void>
  onPreview?: (value: PortableTextValue) => void
  onChange?: (value: PortableTextValue) => void
  onCancel?: () => void
  onSaveSuccess?: () => void
  showActions?: boolean
  ariaLabel?: string
  autoFocus?: boolean
  editorOptions?: PortableTextEditorOptions
  editorClassName?: string
  editorContainerClassName?: string
  singleLine?: boolean
}

const createEmptyContent = (): PortableTextValue => [
  {
    _type: 'block',
    _key: generateRandomKey(),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: generateRandomKey(), text: '' }],
  },
]

export const PortableTextEditorSection = ({
  initialContent,
  onSave,
  onPreview,
  onChange,
  onCancel,
  onSaveSuccess,
  showActions = true,
  ariaLabel,
  autoFocus = false,
  editorOptions,
  editorClassName,
  editorContainerClassName,
  singleLine = false,
}: PortableTextEditorSectionProps) => {
  const [draftValue, setDraftValue] = useState<PortableTextValue>(
    () => initialContent ?? createEmptyContent()
  )
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { schemaDefinition, editorNodes } =
    createPortableTextEditorConfig(editorOptions)

  const handleSave = () => {
    if (!onSave) {
      setSaveError(PT_STRINGS.editor.notConfigured)
      return
    }
    const save = onSave

    startTransition(async () => {
      try {
        await save(draftValue)
        setSaveError(null)
        onSaveSuccess?.()
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : PT_STRINGS.editor.saveFailed
        )
      }
    })
  }

  const handlePreview = () => {
    onPreview?.(draftValue)
  }

  return (
    <Box className={cn('ui-stack gap-1.5', editorContainerClassName)}>
      <EditorProvider
        initialConfig={{
          schemaDefinition,
          initialValue: draftValue,
        }}
      >
        <NodePlugin nodes={editorNodes} />
        <EventListenerPlugin
          on={(event) => {
            if (event.type === 'mutation') {
              const nextValue = event.value as PortableTextValue
              setDraftValue(nextValue)
              onChange?.(nextValue)
            }
          }}
        />
        <ClearOtherDecorators />
        <Toolbar {...editorOptions} />
        <PortableTextEditable
          aria-label={ariaLabel}
          autoFocus={autoFocus}
          onKeyDown={(event) => {
            if (singleLine && event.key === 'Enter') {
              event.preventDefault()
            }
          }}
          className={cn(
            'min-h-40 whitespace-pre-line rounded-md border border-grey-300 bg-background-200 p-3 pt-editor-container text-fg text-sm outline-none focus:border-brand',
            editorClassName
          )}
        />
      </EditorProvider>

      {saveError && <p className='text-red-600 text-sm'>{saveError}</p>}

      {showActions && (
        <Box className='flex flex-wrap gap-2'>
          {onPreview && (
            <Button
              aria-label={PT_STRINGS.editor.preview}
              onClick={handlePreview}
              disabled={isPending}
              className='rounded-md border border-grey-300 px-4 py-2 text-fg text-sm'
            >
              {PT_STRINGS.editor.preview}
            </Button>
          )}
          <Button
            aria-label={PT_STRINGS.editor.save}
            onClick={handleSave}
            disabled={isPending}
            className='rounded-md bg-fg px-4 py-2 text-sm text-white'
          >
            {PT_STRINGS.editor.save}
          </Button>
          <Button
            aria-label={PT_STRINGS.editor.cancel}
            onClick={onCancel}
            disabled={isPending}
            className='rounded-md border border-grey-300 px-4 py-2 text-fg text-sm'
          >
            {PT_STRINGS.editor.cancel}
          </Button>
        </Box>
      )}
    </Box>
  )
}
