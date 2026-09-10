import { Box, type BoxProps } from '@/components/common/Box'
import { NextLink, type NextLinkProps } from '@/components/common/NextLink'
import { Text, type TextProps } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'

export type DetailLinkProps = {
  label?: string
  labelProps?: Omit<TextProps, 'children'>
  value?: React.ReactNode
  valueProps?: Omit<BoxProps, 'children'>
} & Omit<NextLinkProps, 'children'>

export const DetailLink = ({
  className,
  href,
  label,
  labelProps,
  value,
  valueProps,
  ...rest
}: DetailLinkProps) => {
  return (
    <>
      {(label || value) && (
        <NextLink
          href={href}
          className={cn('group ui-stack gap-0.5 w-fit text-brand', className)}
          {...rest}
        >
          {label && (
            <Text
              {...labelProps}
              className={cn(
                'ui-caption font-bold text-current/90 group-hover:text-current/70',
                labelProps?.className
              )}
            >
              {label}
            </Text>
          )}
          {value && (
            <Box
              {...valueProps}
              className={cn(
                'ui-body transition-all duration-200 underline-offset-4 group-hover:text-current group-hover:underline decoration-current/30',
                valueProps?.className
              )}
            >
              {value ?? '—'}
            </Box>
          )}
        </NextLink>
      )}
    </>
  )
}
