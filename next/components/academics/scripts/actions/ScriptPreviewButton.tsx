import { UI_STRINGS } from '@shared/config/strings'
import { Button } from '@/components/common/Button'
import { cn } from '@/lib/common-utils'
import type { ScriptPreviewButtonProps } from '@/types/components/Scripts.types'

/** Preview action for a single script.
 * TODO: open the script in a preview mode (modal or dedicated page).
 */
export const ScriptPreviewButton = ({
  id,
  className,
  children,
  ...props
}: ScriptPreviewButtonProps) => (
  <Button
    {...props}
    className={cn('button solid px-3 py-1.5 ui-caption', className)}
    data-script-id={id}
  >
    {children ?? UI_STRINGS.scripts.actions.preview}
  </Button>
)
