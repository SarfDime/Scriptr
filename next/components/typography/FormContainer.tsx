import type { AdditionalComponentAttributes } from '../../types/component.types'

type FormContainerProps = {
  children?: React.ReactNode
  formName?: string
  formMethod?: string
  onSubmitProp: (e: React.FormEvent<HTMLFormElement>) => void /// TODO: fix type
  formRef?: React.RefObject<HTMLFormElement>
} & AdditionalComponentAttributes

/** A form container component which wraps a `form` element. It forwards any
 * additional props to the underlying `form` element.
 */
export function FormContainer({
  children,
  formName,
  onSubmitProp,
  formRef,
  ...rest
}: FormContainerProps) {
  return (
    <form
      ref={formRef}
      name={formName}
      onSubmit={onSubmitProp}
      encType='application/x-www-form-urlencoded'
      {...rest}
    >
      {children}
    </form>
  )
}
