'use client'

import { UI_STRINGS } from '@shared/config/strings'
import dynamic from 'next/dynamic'
import { Box } from '@/components/common/Box'
import { RESTRICTED_EDITOR_OPTIONS } from '@/components/typography/portable-text/toolbar/editor-options'
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
}

/** The details section (title + description) of a script form. */
export function ScriptDetailsFields({
  fields,
  resetKey,
}: ScriptDetailsFieldsProps) {
  const {
    title,
    description,
    changeTitle,
    changeDescription,
    titleTooLong,
    titleValid,
    titleInvalid,
    descriptionInvalid,
  } = fields

  return (
    <Box className='ui-stack gap-5 p-5'>
      <Field
        className='min-w-0'
        label={UI_STRINGS.scripts.uploadModal.formTitle}
        labelProps={SCRIPT_FIELD_LABEL_PROPS}
        helperText={UI_STRINGS.scripts.uploadModal.formTitleHelp}
        errorText={
          titleTooLong
            ? UI_STRINGS.scripts.uploadModal.fieldErrors.titleTooLong
            : UI_STRINGS.scripts.uploadModal.fieldErrors.titleRequired
        }
        required
        valid={titleValid}
        invalid={titleInvalid}
      >
        <PortableTextEditorSection
          key={`title-${resetKey}`}
          initialContent={title}
          onChange={changeTitle}
          showActions={false}
          ariaLabel={UI_STRINGS.scripts.uploadModal.formTitle}
          editorOptions={RESTRICTED_EDITOR_OPTIONS}
          editorClassName='h-10 min-h-0 overflow-hidden whitespace-nowrap p-2'
          singleLine
        />
      </Field>

      <Field
        className='min-w-0'
        label={UI_STRINGS.scripts.uploadModal.formDescription}
        labelProps={SCRIPT_FIELD_LABEL_PROPS}
        helperText={UI_STRINGS.scripts.uploadModal.formDescriptionHelp}
        errorText={
          UI_STRINGS.scripts.uploadModal.fieldErrors.descriptionTooLong
        }
        invalid={descriptionInvalid}
      >
        <PortableTextEditorSection
          key={`description-${resetKey}`}
          initialContent={description}
          onChange={changeDescription}
          showActions={false}
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
