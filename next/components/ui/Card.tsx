import type { PortableTextType } from '@/types/components/PortableText.types'
import { cn } from '../../lib/common-utils'
import type { BoxProps } from '../common/Box'
import { Box } from '../common/Box'
import { NextLink, type NextLinkProps } from '../common/NextLink'
import type { TitleProps } from '../typography/Title'
import { Title } from '../typography/Title'

type CardHeaderProps = {
  title?: PortableTextType
  titleProps?: TitleProps
} & BoxProps

const CardRoot = ({ className, children, ...rest }: BoxProps) => (
  <Box className={cn('ui-card', className)} {...rest}>
    {children}
  </Box>
)

/**
 * A CardRoot that can also be a link. If the href is '#', it will render a
 * clickable div with role 'button' and tabIndex 0. Otherwise, it will render a
 * NextLink.
 */
export const CardRootClickable = (props: NextLinkProps) => {
  const { children } = props

  return <NextLink {...props}>{children}</NextLink>
}

const CardHeader = ({
  title,
  titleProps,
  children,
  className,
  ...rest
}: CardHeaderProps) => (
  <Box className={cn('ui-card-header', className)} {...rest}>
    {children || (
      <Title as='h3' {...titleProps}>
        {title}
      </Title>
    )}
  </Box>
)

const CardBody = ({ className, children, ...rest }: BoxProps) => (
  <Box className={cn('ui-card-body', className)} {...rest}>
    {children}
  </Box>
)

const CardFooter = ({ className, children, ...rest }: BoxProps) => (
  <Box className={cn('ui-card-footer', className)} {...rest}>
    {children}
  </Box>
)

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
})

export const ClickableCard = Object.assign(CardRootClickable, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
})
