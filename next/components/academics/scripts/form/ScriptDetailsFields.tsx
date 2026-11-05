'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { portableTextToPlainText } from '@shared/utils/portable-text.utils'
import { slugifyTitle } from '@shared/utils/slug.utils'
import dynamic from 'next/dynamic'
import { Box } from '@/components/common/Box'
import { RESTRICTED_EDITOR_OPTIONS } from '@/components/typography/portable-text/toolbar/editor-options'
import { Text } from '@/components/typography/Text'
import { Divider } from '@/components/ui/Divider'
import { Field } from '@/components/ui/field/Field'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'
import type { UseScriptTextFieldsReturn } from '@/hooks/useScriptTextFields'
import { SCRIPT_FIELD_LABEL_PROPS } from './script-form-layout'

/** The editor's own boxes — padding, toolbar row and editing area — at the same
 * heights, so the form does not jump when the editor replaces it. The editing
 * area takes its height from `--pt-editor-height` on the field, which is set to
 * match the `editorClassName` of the instance it stands in for. */
function EditorPlaceholder() {
  return (
    <Box
      role='status'
      aria-busy='true'
      aria-label={UI_STRINGS.general.loading}
      className='ui-stack ui-above-inside'
    >
      <Box className='ui-cluster gap-2'>
        <Skeleton loading className='h-7 w-10' />
        <Skeleton loading className='h-7 w-14' />
        <Skeleton loading className='h-7 w-14' />
        <Skeleton loading className='h-7 w-12' />
      </Box>
      <Skeleton loading className='w-full min-h-(--pt-editor-height,7rem)' />
    </Box>
  )
}

const PortableTextEditorSection = dynamic(
  () =>
    import(
      '@/components/typography/portable-text/PortableTextEditorSection'
    ).then((module) => module.PortableTextEditorSection),
  { ssr: false, loading: EditorPlaceholder }
)

export type ScriptDetailsFieldsProps = {
  fields: UseScriptTextFieldsReturn
  /** Changes when the form is cleared, remounting the uncontrolled editors. */
  resetKey: string | number
  /** The stored slug when editing. Absent while creating, where the title is
   * previewed instead — the slug is minted with the row and never changes. */
  slug?: string
}

/** The details section (title + description) of a script form. */
export function ScriptDetailsFields({
  fields,
  resetKey,
  slug,
}: ScriptDetailsFieldsProps) {
  const {
    title,
    description,
    changeTitle,
    changeDescription,
    titleTooLong,
    titleUnsupportedScript,
    titleValid,
    titleInvalid,
    descriptionUnsupportedScript,
    descriptionInvalid,
  } = fields

  const titleError = (() => {
    if (titleUnsupportedScript) {
      return UI_STRINGS.scripts.uploadModal.fieldErrors.unsupportedScript
    }
    return titleTooLong
      ? UI_STRINGS.scripts.uploadModal.fieldErrors.titleTooLong
      : UI_STRINGS.scripts.uploadModal.fieldErrors.titleRequired
  })()

  return (
    <>
      <Field
        // `h-10` on the one-line editor: the placeholder is that tall too.
        className='min-w-0 [--pt-editor-height:2.5rem]'
        label={UI_STRINGS.scripts.uploadModal.formTitle}
        labelProps={SCRIPT_FIELD_LABEL_PROPS}
        helperText={UI_STRINGS.scripts.uploadModal.formTitleHelp}
        errorText={titleError}
        required
        valid={titleValid}
        invalid={titleInvalid}
      >
        <PortableTextEditorSection
          key={`title-${resetKey}`}
          initialContent={title}
          onChange={changeTitle}
          ariaLabel={UI_STRINGS.scripts.uploadModal.formTitle}
          editorOptions={RESTRICTED_EDITOR_OPTIONS}
          editorClassName='h-10 min-h-0 overflow-hidden whitespace-nowrap p-2'
          singleLine
        />
      </Field>
      <Box className='ui-stack gap-1'>
        <Text className='ui-caption'>
          {UI_STRINGS.scripts.uploadModal.slug.label}:{' '}
          <code>
            {slug
              ? UI_STRINGS.scripts.uploadModal.slug.path(slug)
              : UI_STRINGS.scripts.uploadModal.slug.previewPath(
                  slugifyTitle(portableTextToPlainText(title)) || 'script'
                )}
          </code>
        </Text>
        <Text className='ui-label'>
          {slug
            ? UI_STRINGS.scripts.uploadModal.slug.fixedNote
            : UI_STRINGS.scripts.uploadModal.slug.previewNote}
        </Text>
      </Box>
      <Divider />

      <Field
        className='min-w-0'
        label={UI_STRINGS.scripts.uploadModal.formDescription}
        labelProps={SCRIPT_FIELD_LABEL_PROPS}
        helperText={UI_STRINGS.scripts.uploadModal.formDescriptionHelp}
        errorText={
          descriptionUnsupportedScript
            ? UI_STRINGS.scripts.uploadModal.fieldErrors.unsupportedScript
            : UI_STRINGS.scripts.uploadModal.fieldErrors.descriptionTooLong
        }
        invalid={descriptionInvalid}
      >
        <PortableTextEditorSection
          key={`description-${resetKey}`}
          initialContent={description}
          onChange={changeDescription}
          ariaLabel={UI_STRINGS.scripts.uploadModal.formDescription}
          editorOptions={{
            excludedStyles: ['h1', 'h2', 'h3'],
            excludedColors: RESTRICTED_EDITOR_OPTIONS.excludedColors,
          }}
          editorClassName='min-h-28'
        />
      </Field>
    </>
  )
}
