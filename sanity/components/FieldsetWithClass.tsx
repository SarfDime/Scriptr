/**
 * A hidden fieldset that provides a class that can be used to style the
 * surrounding fieldset.
 * We use this to add styling to a fieldset.
 */
export function FieldsetWithClass(customClassName: string) {
  return (
    <div
      className={`custom-fieldset ${customClassName}`}
      style={{ display: 'none' }}
    />
  )
}
