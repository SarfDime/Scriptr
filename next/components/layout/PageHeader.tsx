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
  title?: string
  subtitle?: string
  children?: React.ReactNode
}) => {
  return (
    <Box className='ui-cluster justify-between items-end'>
      <Box className='ui-stack gap-1'>
        {greeting && (
          <Text className='ui-title text-brand-400'>{greeting}</Text>
        )}
        {title && (
          <Title as='h1' className='ui-display'>
            {title}
          </Title>
        )}
        {subtitle && <Text className='ui-subtitle'>{subtitle}</Text>}
      </Box>
      {children}
    </Box>
  )
}
