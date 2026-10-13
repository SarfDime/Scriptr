import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import type { UniversityDetail } from '@/types/academics/university.types'

type UniversityContactCardProps = Pick<
  UniversityDetail,
  'streetAddress' | 'telephone' | 'email' | 'website'
>

export const UniversityContactCard = ({
  streetAddress,
  telephone,
  email,
  website,
}: UniversityContactCardProps) => {
  if (!streetAddress && !telephone && !email && !website) return null

  return (
    <Card className='ui-stack ui-above'>
      <SectionHeader as='h3' title='Contact & Location' />
      {streetAddress && (
        <Box className='ui-stack gap-0.5 ui-above-inside'>
          <Text className='ui-label'>Address</Text>
          <Text className='ui-body'>{streetAddress}</Text>
        </Box>
      )}
      {telephone && (
        <Box className='ui-stack gap-0.5 ui-above-inside'>
          <Text className='ui-label'>Phone</Text>
          <Text className='ui-body'>{telephone}</Text>
        </Box>
      )}
      {email && (
        <Box className='ui-stack gap-0.5 ui-above-inside'>
          <Text className='ui-label'>Email</Text>
          <NextLink href={`mailto:${email}`} className='ui-body w-fit'>
            {email}
          </NextLink>
        </Box>
      )}
      {website && (
        <Box className='ui-stack gap-0.5 ui-above-inside'>
          <Text className='ui-label'>Website</Text>
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
