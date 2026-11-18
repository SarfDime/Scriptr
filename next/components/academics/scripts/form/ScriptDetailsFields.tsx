'use client'

import { ENGLISH_LOCALE } from '@shared/config/localization-constants'
import { PORTABLE_TEXT_LIMITS } from '@shared/config/portable-text-limits'
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
import { useUIStrings } from '@/providers/locale/use-strings'
import { ScriptLanguageSelector } from './ScriptLanguageSelector'
import { SCRIPT_FIELD_LABEL_PROPS } from './script-form-layout'

/** The editor's own boxes — padding, toolbar row and editing area — at the same
 * heights, so the form does not jump when the editor replaces it. The editing
 * area takes its height from `--pt-editor-height` on the field, which is set to
 * match the `editorClassName` of the instance it stands in for. */
function EditorPlaceholder() {
  const ui = useUIStrings()

  return (
    <Box
      role='status'
      aria-busy='true'
      aria-label={ui.general.loading}
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

/**
 * The details section (title + description) of a script form. A script carries
 * its text in one or more languages, so the section edits one language at a
 * time — the selector chooses which — instead of stacking an editor per
 * language. Every language the author touches stays in form state, and the
 * title must be filled in at least one of them.
 */
export function ScriptDetailsFields({
  fields,
  resetKey,
  slug,
}: ScriptDetailsFieldsProps) {
  const ui = useUIStrings()
  const {
    language,
    changeLanguage,
    title,
    description,
    changeTitle,
    changeDescription,
    titleFilledLanguages,
    titleHasContent,
    titleTooLong,
    titleTooShort,
    titleUnsupportedScript,
    titleWrongScript,
    titleValid,
    titleInvalid,
    descriptionUnsupportedScript,
    descriptionWrongScript,
    descriptionInvalid,
  } = fields

  const fieldErrors = ui.scripts.uploadModal.fieldErrors
  const wrongScriptError =
    language === ENGLISH_LOCALE
      ? fieldErrors.wrongScriptLatin
      : fieldErrors.wrongScriptCyrillic

  const titleError = (() => {
    if (titleWrongScript) return wrongScriptError
    if (titleUnsupportedScript) return fieldErrors.unsupportedScript
    if (!titleHasContent) return fieldErrors.titleRequired
    if (titleTooShort) {
      return fieldErrors.titleTooShort(
        PORTABLE_TEXT_LIMITS.scriptTitleMinimumLetters
      )
    }
    if (titleTooLong) return fieldErrors.titleTooLong
    return undefined
  })()

  const descriptionError = (() => {
    if (descriptionWrongScript) return wrongScriptError
    if (descriptionUnsupportedScript) return fieldErrors.unsupportedScript
    return fieldErrors.descriptionTooLong
  })()

  return (
    <>
      <ScriptLanguageSelector
        value={language}
        onChange={changeLanguage}
        filled={titleFilledLanguages}
      />
      <Field
        // `h-10` on the one-line editor: the placeholder is that tall too.
        className='min-w-0 [--pt-editor-height:2.5rem]'
        grouped
        label={ui.scripts.uploadModal.formTitle}
        labelProps={SCRIPT_FIELD_LABEL_PROPS}
        helperText={ui.scripts.uploadModal.formTitleHelp}
        errorText={titleError}
        required
        valid={titleValid}
        invalid={titleInvalid}
      >
        <PortableTextEditorSection
          key={`title-${language}-${resetKey}`}
          initialContent={title}
          onChange={changeTitle}
          ariaLabel={ui.scripts.uploadModal.formTitle}
          editorOptions={RESTRICTED_EDITOR_OPTIONS}
          editorClassName='h-10 min-h-0 overflow-hidden whitespace-nowrap p-2'
          singleLine
          autoCapitalize
        />
      </Field>
      <Box className='ui-stack gap-1'>
        <Text className='ui-label'>
          {ui.scripts.uploadModal.slug.label}:{' '}
          <code>
            {slug
              ? ui.scripts.uploadModal.slug.path(slug)
              : ui.scripts.uploadModal.slug.previewPath(
                  slugifyTitle(portableTextToPlainText(title)) || 'script'
                )}
          </code>
        </Text>
        <Text className='ui-label'>
          {slug
            ? ui.scripts.uploadModal.slug.fixedNote
            : ui.scripts.uploadModal.slug.previewNote}
        </Text>
      </Box>
      <Divider />

      <Field
        className='min-w-0'
        grouped
        label={ui.scripts.uploadModal.formDescription}
        labelProps={SCRIPT_FIELD_LABEL_PROPS}
        helperText={ui.scripts.uploadModal.formDescriptionHelp}
        errorText={descriptionError}
        invalid={descriptionInvalid}
      >
        <PortableTextEditorSection
          key={`description-${language}-${resetKey}`}
          initialContent={description}
          onChange={changeDescription}
          ariaLabel={ui.scripts.uploadModal.formDescription}
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
