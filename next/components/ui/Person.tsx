import type { SanityImageType } from '@shared/types/sanity-transform.types'
import { Box, type BoxProps } from '@/components/common/Box'
import { Text, type TextProps } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'

export type PersonType = {
  name: string
  title?: string
  description?: string
  picture?: SanityImageType
  website?: string // Deferred: make provider websites clickable and support person pictures.
}

export type PersonProps = {
  title?: string
  nameProps?: TextProps
  titleProps?: TextProps
  descriptionProps?: TextProps
} & Omit<BoxProps, 'title' | 'name'> &
  PersonType

export const Person = ({
  name,
  title,
  description,
  titleProps,
  nameProps,
  descriptionProps,
  className,
  ...boxProps
}: PersonProps) => {
  return (
    <Box className={cn('ui-stack gap-0.5', className)} {...boxProps}>
      {title && (
        <Text className={cn('ui-label', titleProps?.className)} {...titleProps}>
          {title}
        </Text>
      )}
      <Text
        className={cn('ui-body-strong', nameProps?.className)}
        {...nameProps}
      >
        {name}
      </Text>
      {description && (
        <Text
          className={cn('ui-caption', descriptionProps?.className)}
          {...descriptionProps}
        >
          {description}
        </Text>
      )}
    </Box>
  )
}
