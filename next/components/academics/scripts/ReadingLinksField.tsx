'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { getReadingLinkErrors } from '@shared/utils/link-utils'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { InputWrapper } from '@/components/typography/InputWrapper'
import type { TextProps } from '@/components/typography/Text'
import { Field } from '@/components/ui/field/Field'
import { cn } from '@/lib/common-utils'
import type { ReadingLinksFieldProps } from '@/types/components/ReadingLinksField.types'

const FIELD_LABEL_PROPS: TextProps = { className: 'text-base font-semibold' }

/**
 * The additional-reading rows shared by the create and edit script forms.
 * Presentational: the link list and the "touched" set live in the parent
 * (see `useReadingLinkTouched`); errors come from the shared validator the
 * API applies as well, and only show for rows the user has left.
 */
export function ReadingLinksField({
  links,
  touched,
  disabled,
  onAdd,
  onChange,
  onRemove,
  onTouch,
}: ReadingLinksFieldProps) {
  const linkErrors = getReadingLinkErrors(links)
  const hasLinkErrors = linkErrors.some((error) => error !== null)
  const hasVisibleLinkErrors = linkErrors.some(
    (error, index) => error !== null && touched.has(index)
  )
  const hasLinks = links.some((link) => link.trim() !== '')

  return (
    <Field
      className='min-w-0'
      label={UI_STRINGS.scripts.uploadModal.additionalReadingLabel}
      labelProps={FIELD_LABEL_PROPS}
      helperText={UI_STRINGS.scripts.uploadModal.additionalReadingHelp}
      valid={hasLinks && !hasLinkErrors}
      invalid={hasVisibleLinkErrors}
    >
      <Box className='ui-stack gap-2'>
        {links.map((link, index) => {
          const isTouched = touched.has(index)
          const errorCode = isTouched ? linkErrors[index] : null

          return (
            <InputWrapper
              key={index}
              valid={isTouched && link.trim() !== '' && !errorCode}
              invalid={Boolean(errorCode)}
              inputProps={{
                type: 'url',
                placeholder:
                  UI_STRINGS.scripts.uploadModal.readingLinkPlaceholder,
                'aria-label':
                  UI_STRINGS.scripts.uploadModal.additionalReadingLabel,
                onBlur: () => onTouch(index),
              }}
              errorText={
                errorCode
                  ? UI_STRINGS.scripts.uploadModal.readingLinkErrors[errorCode]
                  : undefined
              }
              inputVal={link}
              inputOnChange={(event) => onChange(index, event.target.value)}
              wrapperProps={{ className: cn('h-7 pl-0') }}
              inputClearButton={true}
              inputOnClear={() => onChange(index, '')}
              disabled={disabled}
            >
              <Button
                onClick={() => onRemove(index)}
                disabled={disabled}
                className='button button-sm danger mr-1 rounded-none'
                aria-label={UI_STRINGS.scripts.uploadModal.removeLinkAriaLabel}
              >
                {UI_STRINGS.scripts.uploadModal.removeButtonLabel}
              </Button>
            </InputWrapper>
          )
        })}
        <Button
          onClick={onAdd}
          disabled={disabled}
          className='button button-sm success self-start rounded-md'
        >
          {UI_STRINGS.scripts.uploadModal.addLinkButtonLabel}
        </Button>
      </Box>
    </Field>
  )
}
