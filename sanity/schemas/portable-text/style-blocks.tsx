import {
  FONT_SIZE_STYLES,
  type FontSizeLabelsType,
} from '@shared/config/shared-pt-config'
import type { CSSProperties } from 'react'
import type { BlockStyleProps } from 'sanity'

const TitleStyle = (
  props: BlockStyleProps,
  styles: CSSProperties,
  className: FontSizeLabelsType | 'style-divider' | 'N/A'
) => (
  <span
    className={`style-selector ${className}`}
    data-style-label={className === 'style-divider' ? '—' : className}
    style={{ ...styles, lineHeightStep: '0.5rem' }}
  >
    {props?.children}
  </span>
)

const DefaultStyles = FONT_SIZE_STYLES.map((f) => ({
  title: f.label,
  value: f.name,
  component: (props: BlockStyleProps) =>
    TitleStyle(
      props,
      {
        ...f,
        lineHeightStep: '0.5rem',
      },
      f.label === '—' ? 'style-divider' : f.label
    ),
}))

export { DefaultStyles }
