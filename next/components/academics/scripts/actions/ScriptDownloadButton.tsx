import DownloadIcon from '@sanity/icons/Download'
import { Button } from '@/components/common/Button'
import { cn } from '@/lib/common-utils'
import type { ScriptDownloadButtonProps } from '@/types/components/Scripts.types'

/** Download action for a single script.
 * TODO: wire this up to actually trigger the script file download.
 */
export const ScriptDownloadButton = ({
  id,
  className,
  iconProps,
  children,
  ...props
}: ScriptDownloadButtonProps) => (
  <Button
    {...props}
    className={cn('button basic gap-1.5 px-2.5 py-1.5 ui-caption', className)}
    data-script-id={id}
  >
    <DownloadIcon {...iconProps} />
    {children}
  </Button>
)
