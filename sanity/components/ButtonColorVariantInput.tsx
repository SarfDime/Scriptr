import { useFormValue } from 'sanity'
import type {
  ButtonColorVariantInputProps,
  ButtonVariantOption,
} from '../types/button.types'
import { VariantListInput } from './VariantListInput'

const DEFAULT_BUTTON_VARIANTS: Array<ButtonVariantOption> = [
  { title: 'Unset', value: undefined },
  { title: 'Transparent', value: 'transparent' },
  { title: 'Transparent White', value: 'transparent alternate' },
  { title: 'Solid', value: 'solid' },
  { title: 'Solid Inverted', value: 'solid inverted' },
  { title: 'Subtle', value: 'subtle' },
  { title: 'Gold', value: 'golden' },
  { title: 'Success', value: 'success' },
  { title: 'Error', value: 'error' },
]

/** Button list input */
export function ButtonColorVariantInput(props: ButtonColorVariantInputProps) {
  const { schemaType, value, onChange } = props
  const options = schemaType?.options?.list ?? DEFAULT_BUTTON_VARIANTS
  const buttonLabel = useFormValue(['stringTitle.en']) as string

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
