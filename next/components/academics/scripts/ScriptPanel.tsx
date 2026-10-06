import { Box, type BoxProps } from '@/components/common/Box'
import { cn } from '@/lib/common-utils'

/** The inset surface used inside a `ScriptSurface` (script info, additional
 * reading, file cards): a translucent fill where the text sits. Renders an
 * `aside` by default; pass `as='div'` for non-landmark content. */
export const ScriptPanel = ({ className, children, ...rest }: BoxProps) => (
  <Box
    as='aside'
    className={cn(
      'flex flex-col gap-4 rounded-lg border border-grey-200 bg-background-100/60 p-4',
      className
    )}
    {...rest}
  >
    {children}
  </Box>
)
