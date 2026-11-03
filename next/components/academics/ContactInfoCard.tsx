import { UI_STRINGS } from '@shared/config/strings'
import { cn } from '@/lib/common-utils'
import { Box } from '../common/Box'
import { SectionHeader } from '../common/SectionHeader'
import { Text } from '../typography/Text'
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
  title = UI_STRINGS.academics.contactAndLocation,
  streetAddress,
  addressLabel = UI_STRINGS.academics.address,
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
      <SectionHeader as='h3' title={title} />
      {streetAddress && (
        <Box className='ui-stack gap-0.5'>
          <Text className='ui-label'>{addressLabel}</Text>
          <Text className='ui-body'>{streetAddress}</Text>
        </Box>
      )}
      {telephone && (
        <Box className='ui-stack gap-0.5'>
          <Text className='ui-label'>
            {UI_STRINGS.academics.professor.phone}
          </Text>
          <Text className='ui-body'>{telephone}</Text>
        </Box>
      )}
      {email && (
        <Box className='ui-stack gap-0.5'>
          <Text className='ui-label'>
            {UI_STRINGS.academics.professor.email}
          </Text>
          <Text className='ui-body'>{email}</Text>
        </Box>
      )}
      {website && (
        <Box className='ui-stack gap-0.5'>
          <Text className='ui-label'>
            {UI_STRINGS.academics.professor.website}
          </Text>
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
