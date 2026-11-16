/** A hidden fieldset that carries a class onto the surrounding fieldset, which
 * the Studio stylesheet then targets. */
export function FieldsetWithClass(customClassName: string) {
  return (
    <div
      className={`custom-fieldset ${customClassName}`}
      style={{ display: 'none' }}
    />
  )
}
