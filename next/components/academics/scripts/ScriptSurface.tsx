import { Box, type BoxProps } from '@/components/common/Box'
import { cn } from '@/lib/common-utils'

/** The outer translucent surface of a group on the script page (info + reading,
 * files). Holds `ScriptPanel`s, which carry the inner fill behind the text. */
export const ScriptSurface = ({ className, children, ...rest }: BoxProps) => (
  <Box className={cn('ui-above rounded-xl border p-3', className)} {...rest}>
    {children}
  </Box>
)
