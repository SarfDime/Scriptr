import { PortableText } from 'next-sanity'

import { cn } from '../../lib/common-utils'
import type { PortableContentProps } from '../../types/components/PortableText.types'
import { Box } from '../common/Box'
import { portableTextParser } from './PortableTextParser'

/**
 * A component for rendering markdown content using Portable Text.
 * It supports an optional wrapper element, customizable rendering for
 * specific block types, and flexible element overrides.
 */
export const PortableTextContent = ({
  portableText,
  renderDefaultBlock,
  renderWrapper = false,
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
          className={cn('markdown markdown-defaults', className)}
        >
          {portableText && (
            <PortableText
              value={portableText}
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
          {portableText && (
            <PortableText
              value={portableText}
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
