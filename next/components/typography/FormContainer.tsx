import type { SubmitEvent } from 'react'
import type { AdditionalComponentAttributes } from '../../types/component.types'

type FormContainerProps = {
  onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
} & Omit<AdditionalComponentAttributes, 'onSubmit'>

/** A form container component which wraps a `form` element. It forwards any
 * additional props to the underlying `form` element.
 */
export function FormContainer({
  children,
  onSubmit,
  ...rest
}: FormContainerProps) {
  return (
    <form
      onSubmit={onSubmit}
      encType='application/x-www-form-urlencoded'
      {...rest}
    >
      {children}
    </form>
  )
}
