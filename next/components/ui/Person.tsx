import type { SanityImageType } from '@shared/types/sanity-transform.types'
import { Box, type BoxProps } from '@/components/common/Box'
import { Text, type TextProps } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import { IMAGE_SIZES } from '@/styles/style'
import { NextLink } from '../common/NextLink'
import { Avatar } from './Avatar'

export type PersonType = {
  name: string
  title?: string
  description?: string
  picture?: SanityImageType
  website?: string
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
  picture,
  website,
  className,
  ...boxProps
}: PersonProps) => {
  return (
    <Box className={cn('ui-stack gap-0.5', className)} {...boxProps}>
      {picture && (
        <Avatar
          name={name}
          picture={{
            ...picture,
            fillProp: true,
            sizes: IMAGE_SIZES.AVATAR,
          }}
        />
      )}
      {title && (
        <Text className={cn('ui-label', titleProps?.className)} {...titleProps}>
          {title}
        </Text>
      )}
      {website ? (
        <NextLink
          href={website}
          className={cn('ui-body-strong', nameProps?.className)}
          {...nameProps}
        >
          {name}
        </NextLink>
      ) : (
        <Text
          className={cn('ui-body-strong', nameProps?.className)}
          {...nameProps}
        >
          {name}
        </Text>
      )}
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
