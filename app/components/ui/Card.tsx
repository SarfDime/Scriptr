import type { PortableTextType } from '@/types/components/PortableText.types'
import type { BoxProps } from '../common/Box'
import { Box } from '../common/Box'
import { NextLink, type NextLinkProps } from '../common/NextLink'
import type { TitleProps } from '../typography/Title'
import { Title } from '../typography/Title'

type CardHeaderProps = {
  title?: PortableTextType
  titleProps?: TitleProps
} & BoxProps

const CardRoot = (props: BoxProps) => <Box {...props}>{props.children}</Box>

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
  ...rest
}: CardHeaderProps) => (
  <Box {...rest}>
    {children || (
      <Title as='h3' {...titleProps}>
        {title}
      </Title>
    )}
  </Box>
)

const CardBody = (props: BoxProps) => <Box {...props}>{props.children}</Box>

const CardFooter = (props: BoxProps) => <Box {...props}>{props.children}</Box>

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
