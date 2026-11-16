import { BUTTON_VARIANTS } from '@shared/config/shared-pt-config'
import { firstFilledLocalizedText } from '@shared/utils/localized-strings'
import { useFormValue } from 'sanity'
import type { ButtonColorVariantInputProps } from '../types/button.types'
import { VariantListInput } from './VariantListInput'

const DEFAULT_BUTTON_VARIANTS = BUTTON_VARIANTS.map((variant) => ({
  title: variant.charAt(0).toUpperCase() + variant.slice(1),
  value: variant,
}))

/** Button list input */
export function ButtonColorVariantInput(props: ButtonColorVariantInputProps) {
  const { schemaType, value, onChange } = props
  const options = schemaType?.options?.list ?? DEFAULT_BUTTON_VARIANTS
  // The button's label is localized, so the preview shows the first filled
  // language.
  const buttonLabel = firstFilledLocalizedText(useFormValue(['localizedTitle']))

  return (
    <VariantListInput
      options={options}
      value={value}
      onChange={onChange}
      renderPreview={(option) => (
        <div className='variant-list-preview'>
          <div className={`button-variant-preview ${option.value ?? ''}`}>
            {buttonLabel ?? 'Button label'}
          </div>
        </div>
      )}
    />
  )
}
