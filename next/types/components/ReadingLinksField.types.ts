export type ReadingLinksFieldProps = {
  links: Array<string>
  /** Indices of rows the user has left; errors only show for these. */
  touched: ReadonlySet<number>
  disabled: boolean
  onAdd: () => void
  onChange: (index: number, value: string) => void
  onRemove: (index: number) => void
  onTouch: (index: number) => void
}
