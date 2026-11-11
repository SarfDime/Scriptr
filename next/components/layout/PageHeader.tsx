import type { PortableTextValue } from '@shared/types/portable-text.types'
import { Box } from '../common/Box'
import { Text } from '../typography/Text'
import { Title } from '../typography/Title'

export const PageHeader = ({
  greeting,
  title,
  subtitle,
  children,
}: {
  greeting?: string
  title?: string | PortableTextValue
  subtitle?: string
  children?: React.ReactNode
}) => {
  return (
    <Box className='ui-cluster justify-between items-end'>
      <Box className='ui-stack gap-1'>
        {greeting && (
          <Text className='ui-title-modern text-brand-600'>{greeting}</Text>
        )}
        {title && (
          <Title as='h1' className='ui-display'>
            {title}
          </Title>
        )}
        {subtitle && (
          <Text className='ui-body-strong text-fg-muted'>{subtitle}</Text>
        )}
      </Box>
      {children}
    </Box>
  )
}
