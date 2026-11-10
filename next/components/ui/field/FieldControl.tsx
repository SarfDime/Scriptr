'use client'

import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { useFieldControl } from './field-context'

/** An `<input>` that takes its field's id and description. It has to be its own
 * component: a wrapper that renders `<Field>` cannot call the hook itself,
 * because the provider lives inside the `Field` it returns. */
export const FieldInput = (props: InputHTMLAttributes<HTMLInputElement>) => {
  const control = useFieldControl(props.id, props['aria-describedby'])

  return <input {...control} {...props} />
}

/** The `<textarea>` counterpart of `FieldInput`. */
export const FieldTextArea = (
  props: TextareaHTMLAttributes<HTMLTextAreaElement>
) => {
  const control = useFieldControl(props.id, props['aria-describedby'])

  return <textarea {...control} {...props} />
}
