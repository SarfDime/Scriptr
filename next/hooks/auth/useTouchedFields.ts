'use client'

import { useState } from 'react'

export type FieldFeedback = {
  valid: boolean
  invalid: boolean
  errorText: string | undefined
}

/** Maps a validator result to `InputWrapper`'s `valid` / `invalid` /
 * `errorText` props. Nothing is shown until the field has been touched, so a
 * pristine form isn't covered in errors. */
export const getFieldFeedback = (
  error: string | null,
  touched: boolean
): FieldFeedback => ({
  valid: touched && error === null,
  invalid: touched && error !== null,
  errorText: touched && error !== null ? error : undefined,
})

/** Tracks which fields the user has interacted with (typed in or blurred).
 * Shared by the login and register forms. */
export function useTouchedFields<TField extends string>() {
  const [touched, setTouched] = useState<ReadonlySet<TField>>(new Set())

  const touch = (field: TField) =>
    setTouched((current) =>
      current.has(field) ? current : new Set(current).add(field)
    )

  const touchAll = (fields: ReadonlyArray<TField>) =>
    setTouched(new Set(fields))

  const isTouched = (field: TField) => touched.has(field)

  return { touch, touchAll, isTouched }
}
