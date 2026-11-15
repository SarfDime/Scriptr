import { LANGUAGE_FLAGS } from '@shared/components/language-flags'
import type { SupportedLanguage } from '@shared/config/localization-constants'
import type { FieldProps, ObjectInputProps } from 'sanity'

type TranslateFieldWrapperProps = FieldProps & {
  language: SupportedLanguage
}

/**
 * Wraps every language's input so the editor can tell which language a field
 * belongs to. The language's own title is hidden from the default render
 * because the header below already names it.
 */
export const TranslateFieldWrapper = ({
  language,
  ...props
}: TranslateFieldWrapperProps) => {
  const Flag = LANGUAGE_FLAGS[language.id]

  return (
    <div
      className={`locale-field ${
        language.isDefault
          ? 'locale-field--default'
          : 'locale-field--translation'
      }`}
    >
      <div className='locale-field__header'>
        <Flag aria-hidden='true' className='locale-field__flag' />
        <span className='locale-field__language'>{language.title}</span>
        <span
          className={`locale-field__badge locale-field__badge--${
            language.isDefault ? 'default' : 'translation'
          }`}
        >
          {language.isDefault ? 'Default' : 'Translation'}
        </span>
      </div>
      {props.renderDefault({ ...props, title: undefined })}
    </div>
  )
}

/** Binds a language to the wrapper so it can be used as a Sanity field component. */
export const createTranslateFieldWrapper =
  (language: SupportedLanguage) => (props: FieldProps) => (
    <TranslateFieldWrapper {...props} language={language} />
  )

/**
 * Plain wrapper around the localized object input. It gives the per-language
 * layout a stable hook (`locale-object`) so it can be styled without Sanity
 * UI's nesting, and keeps the field group from receiving form-wide rules.
 */
export const LocalizedObjectInput = (props: ObjectInputProps) => (
  <div className='locale-object'>{props.renderDefault(props)}</div>
)
