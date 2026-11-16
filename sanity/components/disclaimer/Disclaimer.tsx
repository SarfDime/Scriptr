import { Icon } from '@sanity/icons'
import { Box } from '@sanity/ui'
import {
  COLOR_CODES,
  type ColorCodeType,
} from '@shared/config/sanity-constants'
import type { CSSProperties, ReactNode } from 'react'

const wrapperStyling = {
  display: 'flex',
  gap: '.5rem',
  alignItems: 'center',
  position: 'relative',
  padding: '.25rem',
  borderRadius: '5px',
  boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.199)',
} as const

/** A boxed disclaimer; `level` picks the palette (info, warning, error, success).
 * - **disclaimerText is deprecated use title and subtitle instead**
 */
export function Disclaimer({
  children,
  level = 'info',
  stylingProps,
  title,
  subtitle,
}: {
  children?: ReactNode
  level?: ColorCodeType
  stylingProps?: CSSProperties
  title?: ReactNode
  subtitle?: ReactNode
}) {
  const color = COLOR_CODES[level]

  const wrapperStyle = {
    color,

    ...wrapperStyling,
    border: `1px solid ${color}`,
  }

  const symbol =
    level === 'success' ? 'checkmark-circle' : (`${level}-outline` as const)

  return (
    <Box className={'disclaimer-field'} style={stylingProps ?? wrapperStyle}>
      {!children ? (
        <>
          <Icon symbol={symbol} width={'2rem'} height={'2rem'} />

          {(title || subtitle) && (
            <Box
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '.1rem',
                paddingBlock: '.25rem',
              }}
            >
              {title && (
                <p style={{ margin: 0, color: 'inherit', fontSize: '0.8rem' }}>
                  {title}
                </p>
              )}

              {subtitle && (
                <p
                  style={{
                    margin: 0,
                    color: 'var(--card-fg-color)',
                    fontSize: '0.7rem',
                  }}
                >
                  {subtitle}
                </p>
              )}
            </Box>
          )}
        </>
      ) : (
        children
      )}
    </Box>
  )
}

/** Usage
 * 
 * 
 * If you need values from the parent

function PinDisclaimer() {
  const document = useFormValue([]) as Doc

  const pinType = document?.pinType
  const disclaimerText =
    pinTypes?.find((e) => e?.value === pinType)?.disclaimer ?? 'empty'

  return pinType ? Disclaimer({ disclaimerText }) : Fragment
}

{
  type: 'string',
  name: 'disclaimer',
  readOnly: true,
  components: {
    input: PinDisclaimer,
  },
},

-- Or --

{
  type: 'string',
  name: 'disclaimer',
  readOnly: true,
  components: {
    input: () =>
      Disclaimer({
        disclaimerText:
          'Disclaimer text.',
      }),
  },
},
 */
