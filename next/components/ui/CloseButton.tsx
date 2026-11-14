'use client'

import { CloseIcon } from '@sanity/icons/Close'
import { useUIStrings } from '@/providers/locale/use-strings'

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
  const ui = useUIStrings()
  return (
    <Button aria-label={ui.general.close} {...rest}>
      {rest?.children ?? <CloseIcon {...iconProps} />}
    </Button>
  )
}
