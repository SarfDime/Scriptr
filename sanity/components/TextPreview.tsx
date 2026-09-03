import type { ComponentProps } from '../types/common.types'

/** Renders a styled text preview.
 *
 * This component displays a text with a custom color, class, and styles.
 * The text is underlined with a dotted line and has a border at the bottom.
 */
export const TextPreview = ({
  title,
  customColor,
  customClass,
}: ComponentProps) => {
  return (
    <span
      className={`text-preview ${title} ${customClass}`}
      style={{
        fontWeight: 600,
        color: customColor,
        textDecoration: 'underline dotted',
        borderBottom: `1px solid ${customColor}`,
      }}
    >
      {title}
    </span>
  )
}
