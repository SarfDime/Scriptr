import { PortableText } from 'next-sanity'

import { cn } from '../../lib/common-utils'
import type { PortableContentProps } from '../../types/components/PortableText.types'
import { Box } from '../common/Box'
import { portableTextParser } from './PortableTextParser'

/**
 * A component for rendering content using Portable Text.
 * It supports an optional wrapper element, customizable rendering for
 * specific block types, and flexible element overrides.
 */
export const PortableTextContent = ({
  children,
  renderDefaultBlock,
  renderWrapper = true,
  as,
  className,
  overrideElements = {},
  ...rest
}: PortableContentProps) => {
  return (
    <>
      {renderWrapper ? (
        <Box
          as={as ?? 'article'}
          {...rest}
          className={cn('pt-text', className)}
        >
          {children && (
            <PortableText
              value={children}
              components={portableTextParser({
                overrideElements,
                renderDefaultBlock,
              })}
            />
          )}
        </Box>
      ) : (
        // biome-ignore lint/complexity/noUselessFragments: <Will cause to show the boolean>
        <>
          {children && (
            <PortableText
              value={children}
              components={portableTextParser({
                renderDefaultBlock,
                overrideElements,
              })}
            />
          )}
        </>
      )}
    </>
  )
}
