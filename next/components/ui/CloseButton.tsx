import { CloseIcon } from '@sanity/icons/Close'
import { UI_STRINGS } from '@shared/config/strings'

import type { SanityIconProps } from '../../types/component.types'
import type { ButtonBaseProps } from '../common/Button'
import { Button } from '../common/Button'

/** `ButtonBaseProps`, not `ButtonProps`: the label below is the default, so a
 * caller only has to pass one when it wants different wording. */
export type CloseButtonProps = {
  iconProps?: SanityIconProps
} & ButtonBaseProps

/** `CloseButton` - A button component that renders a close icon by default.
 * It extends our `Button` component.
 * This component can include custom children or default to a `CloseIcon`.
 */
export function CloseButton({ iconProps, ...rest }: CloseButtonProps) {
  return (
    <Button aria-label={UI_STRINGS.general.close} {...rest}>
      {rest?.children ?? <CloseIcon {...iconProps} />}
    </Button>
  )
}
