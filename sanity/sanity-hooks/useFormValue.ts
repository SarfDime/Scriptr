import { type Path, useFormValue } from 'sanity'

/** A strictly-typed wrapper around Sanity's `useFormValue` hook.
 */
export const useTypedFormValue = <T>(path: Path): T => {
  return useFormValue(path) as T
}
