'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { portableTextToPlainText } from '@shared/utils/portable-text.utils'
import { slugifyTitle } from '@shared/utils/slug.utils'
import dynamic from 'next/dynamic'
import { Box } from '@/components/common/Box'
import { RESTRICTED_EDITOR_OPTIONS } from '@/components/typography/portable-text/toolbar/editor-options'
import { Text } from '@/components/typography/Text'
import { Field } from '@/components/ui/field/Field'
import type { UseScriptTextFieldsReturn } from '@/hooks/useScriptTextFields'
import { SCRIPT_FIELD_LABEL_PROPS } from './script-form-layout'

const PortableTextEditorSection = dynamic(
  () =>
    import(
      '@/components/typography/portable-text/PortableTextEditorSection'
    ).then((module) => module.PortableTextEditorSection),
  { ssr: false }
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
    <Box className='ui-stack gap-5 p-5'>
      <Field
        className='min-w-0'
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
        <Text className='ui-caption'>
          {slug
            ? UI_STRINGS.scripts.uploadModal.slug.fixedNote
            : UI_STRINGS.scripts.uploadModal.slug.previewNote}
        </Text>
      </Box>

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
    </Box>
  )
}
