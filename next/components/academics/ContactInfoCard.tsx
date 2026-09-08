import { cn } from '@/lib/common-utils'
import { Box } from '../common/Box'
import { Text } from '../typography/Text'
import { Title } from '../typography/Title'
import { Card } from '../ui/Card'

export type ContactInfoCardProps = {
  title?: string
  streetAddress?: string
  addressLabel?: string
  telephone?: string
  email?: string
  website?: string
  className?: string
}

export const ContactInfoCard = ({
  title = 'Contact & Location',
  streetAddress,
  addressLabel = 'Address',
  telephone,
  email,
  website,
  className,
}: ContactInfoCardProps) => {
  if (!streetAddress && !telephone && !email && !website) {
    return null
  }

  return (
    <Card className={cn('p-6 ui-stack gap-3', className)}>
      <Title as='h3' className='ui-title font-semibold'>
        {title}
      </Title>
      {streetAddress && (
        <Box className='ui-stack gap-0.5'>
          <Text className='ui-caption font-bold text-grey-500'>
            {addressLabel}
          </Text>
          <Text className='ui-body'>{streetAddress}</Text>
        </Box>
      )}
      {telephone && (
        <Box className='ui-stack gap-0.5'>
          <Text className='ui-caption font-bold text-grey-500'>Phone</Text>
          <Text className='ui-body'>{telephone}</Text>
        </Box>
      )}
      {email && (
        <Box className='ui-stack gap-0.5'>
          <Text className='ui-caption font-bold text-grey-500'>Email</Text>
          <Text className='ui-body'>{email}</Text>
        </Box>
      )}
      {website && (
        <Box className='ui-stack gap-0.5'>
          <Text className='ui-caption font-bold text-grey-500'>Website</Text>
          <a
            href={website}
            target='_blank'
            rel='noreferrer'
            className='ui-body text-brand hover:underline break-all'
          >
            {website}
          </a>
        </Box>
      )}
    </Card>
  )
}
