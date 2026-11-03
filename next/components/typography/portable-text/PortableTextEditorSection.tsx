'use client'

import { EditorProvider, PortableTextEditable } from '@portabletext/editor'
import { EventListenerPlugin, NodePlugin } from '@portabletext/editor/plugins'
import { PT_STRINGS } from '@shared/config/pt-strings'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import { generateRandomKey } from '@shared/utils/common-utils'
import { portableTextToPlainText } from '@shared/utils/portable-text.utils'
import { useState, useTransition } from 'react'
import { Box } from '@/components/common/Box'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import { toUserMessage } from '@/lib/user-facing-error'
import { useToast } from '@/providers/toaster/ToasterProvider'
import type { PortableTextEditorSectionProps } from '@/types/components/PortableTextEditor.types'
import { PortableTextEditorActions } from './PortableTextEditorActions'
import { ClearOtherDecorators } from './toolbar/PTClearOtherDecorators'
import { Toolbar } from './toolbar/PTToolbar'
import { createPortableTextEditorConfig } from './toolbar/schema'

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
  actions = [],
  actionLabels,
  onSave,
  onSaveSuccess,
  onCancel,
  onChange,
  validate,
  confirmCancelWhenDirty = false,
  renderMeta,
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
  const [editorKey, setEditorKey] = useState(0)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { addToast } = useToast()
  const { schemaDefinition, editorNodes } =
    createPortableTextEditorConfig(editorOptions)

  const hasContent = portableTextToPlainText(draftValue).trim().length > 0

  const reportFailure = (description: string) =>
    addToast({
      type: 'error',
      title: PT_STRINGS.editor.saveFailedTitle,
      description,
    })

  const validateDraft = () => {
    if (!onSave) {
      reportFailure(PT_STRINGS.editor.notConfigured)
      return false
    }
    const validationMessage = validate?.(draftValue)
    if (validationMessage) {
      reportFailure(validationMessage)
      return false
    }
    return true
  }

  const handleSave = () => {
    if (!onSave || !validateDraft()) return
    const save = onSave

    startTransition(async () => {
      try {
        const saved = await save(draftValue)
        if (saved !== false) onSaveSuccess?.()
      } catch (error) {
        reportFailure(toUserMessage(error, PT_STRINGS.editor.saveFailed))
      }
    })
  }

  const handleClear = () => {
    const emptyValue = createEmptyContent()
    setDraftValue(emptyValue)
    setIsPreviewing(false)
    setEditorKey((key) => key + 1)
    onChange?.(emptyValue)
  }

  return (
    <Box className={cn('ui-stack ui-above-inside', editorContainerClassName)}>
      <EditorProvider
        key={editorKey}
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
            'min-h-40 whitespace-pre-line ui-above-reverse pt-editor-container text-fg text-sm outline-none focus:border-brand',
            editorClassName
          )}
        />
      </EditorProvider>

      {isPreviewing && hasContent && (
        <Box className='ui-stack ui-above-reverse gap-1'>
          <Text className='ui-caption'>
            {actionLabels?.preview ?? PT_STRINGS.editor.preview}
          </Text>
          <PortableTextContent>{draftValue}</PortableTextContent>
        </Box>
      )}

      <PortableTextEditorActions
        actions={actions}
        labels={actionLabels}
        hasContent={hasContent}
        isPending={isPending}
        isPreviewing={isPreviewing}
        confirmCancel={confirmCancelWhenDirty && hasContent}
        onSaveAttempt={validateDraft}
        meta={renderMeta?.(draftValue)}
        onClear={handleClear}
        onPreview={() => setIsPreviewing((open) => !open)}
        onCancel={() => onCancel?.()}
        onSave={handleSave}
      />
    </Box>
  )
}
