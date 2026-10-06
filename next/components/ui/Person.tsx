import type { SanityImageType } from '@shared/types/sanity-transform.types'
import { Box, type BoxProps } from '@/components/common/Box'
import { Text, type TextProps } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'

export type PersonType = {
  name: string
  title?: string
  description?: string
  picture?: SanityImageType
  website?: string //TODO: Use card for person, and if website is provider make card clickable, also implement person picture
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
        <Text
          className={cn(
            'ui-caption font-bold text-grey-500',
            titleProps?.className
          )}
          {...titleProps}
        >
          {title}
        </Text>
      )}
      <Text
        className={cn('ui-body font-medium', nameProps?.className)}
        {...nameProps}
      >
        {name}
      </Text>
      {description && (
        <Text
          className={cn(
            'ui-caption text-grey-500',
            descriptionProps?.className
          )}
          {...descriptionProps}
        >
          {description}
        </Text>
      )}
    </Box>
  )
}
