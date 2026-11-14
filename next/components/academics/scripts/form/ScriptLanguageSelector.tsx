'use client'

import {
  type LocaleId,
  SUPPORTED_LANGUAGES,
} from '@shared/config/localization-constants'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import { useUIStrings } from '@/providers/locale/use-strings'

type ScriptLanguageSelectorProps = {
  /** The language the editors below are bound to. */
  value: LocaleId
  onChange: (language: LocaleId) => void
  /** Languages that already hold text, so the author can see what is missing
   *  without switching through every tab. */
  filled: ReadonlyArray<LocaleId>
  /** Ties the selector to the field it controls. */
  controls?: string
}

/** Chooses which language of a script's text the form is editing. A script may
 *  carry any subset of the languages, so this is a selector rather than a
 *  duplicate editor per language. */
export function ScriptLanguageSelector({
  value,
  onChange,
  filled,
  controls,
}: ScriptLanguageSelectorProps) {
  const ui = useUIStrings()
  const strings = ui.scripts.uploadModal

  return (
    <fieldset className='ui-stack' aria-controls={controls}>
      <legend className='ui-caption ui-stack gap-1'>
        {strings.languageLabel}
        <Text className='ui-caption opacity-70 my-2'>
          {strings.languageHelp}
        </Text>
      </legend>
      <Box className='ui-cluster gap-1'>
        {SUPPORTED_LANGUAGES.map((language) => {
          const isFilled = filled.includes(language.id)
          return (
            <Button
              key={language.id}
              type='button'
              className={cn('button subtle button-sm', isFilled && 'has-text')}
              isActive={value === language.id}
              disabled={value === language.id}
              aria-pressed={value === language.id}
              onClick={() => onChange(language.id)}
            >
              {language.nativeTitle}
              <Text className='sr-only'>
                {isFilled ? strings.languageFilled : strings.languageEmpty}
              </Text>
            </Button>
          )
        })}
      </Box>
    </fieldset>
  )
}
