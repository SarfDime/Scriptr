'use client'

import { LANGUAGE_FLAGS } from '@shared/components/language-flags'
import {
  type LocaleId,
  SUPPORTED_LANGUAGES,
} from '@shared/config/localization-constants'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { Divider } from '@/components/ui/Divider'
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
      <legend className='ui-body ui-stack gap-1'>
        <Box className='ui-cluster gap-1'>
          <Text>{strings.languageLabel}</Text>
          <Divider orientation='vertical' />
          {SUPPORTED_LANGUAGES.map((language) => {
            const isFilled = filled.includes(language.id)
            const Flag = LANGUAGE_FLAGS[language.id]

            return (
              <Button
                key={language.id}
                type='button'
                className={cn(
                  'button subtle button-sm pl-1.5',
                  isFilled && 'has-text'
                )}
                isActive={value === language.id}
                disabled={value === language.id}
                aria-pressed={value === language.id}
                onClick={() => onChange(language.id)}
              >
                <Flag
                  aria-hidden='true'
                  className='h-4 w-4 overwrite shrink-0'
                />

                {language.nativeTitle}
                <Text className='sr-only'>
                  {isFilled ? strings.languageFilled : strings.languageEmpty}
                </Text>
              </Button>
            )
          })}
        </Box>

        <Text className='ui-label-modern font-semibold mt-2'>
          {strings.languageHelp}
        </Text>
        <Divider />
      </legend>
    </fieldset>
  )
}
