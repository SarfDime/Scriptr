import { CloseIcon } from '@sanity/icons'

import type { IconProps } from '../../types/component.types'
import type { ButtonProps } from '../common/Button'
import { Button } from '../common/Button'

export type CloseButtonProps = { iconProps?: IconProps } & ButtonProps

/** `CloseButton` - A button component that renders a close icon by default.
 * It extends our `Button` component.
 * This component can include custom children or default to a `CloseIcon`.
 */
export function CloseButton({ iconProps, ...rest }: CloseButtonProps) {
  return (
    <Button aria-label='Close' {...rest}>
      {rest?.children ?? <CloseIcon {...iconProps} />}
    </Button>
  )
}
