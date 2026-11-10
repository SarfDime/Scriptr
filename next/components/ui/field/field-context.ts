'use client'

import { createContext, useContext } from 'react'

/** The ids a `Field` generates for one field. */
export type FieldIds = {
  /** What the label's `htmlFor` points at. */
  control: string
  label: string
  helper: string
  error: string
}

type FieldControl = Pick<FieldIds, 'control'> & {
  /** Space-joined helper and error ids, when the field renders either. */
  describedBy: string | undefined
}

export const FieldContext = createContext<FieldControl | null>(null)

/**
 * The `id` and `aria-describedby` a control inside a `Field` should carry, so
 * the field's label targets it and its helper/error text is announced with it.
 * A value the control sets itself wins over the field's.
 */
export const useFieldControl = (
  id?: string,
  describedBy?: string
): { id: string | undefined; 'aria-describedby': string | undefined } => {
  const field = useContext(FieldContext)
  const described = [describedBy, field?.describedBy]
    .filter((value): value is string => Boolean(value))
    .join(' ')

  return {
    id: id ?? field?.control,
    'aria-describedby': described || undefined,
  }
}
