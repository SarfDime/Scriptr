import { UI_STRINGS } from '@shared/config/strings'
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
      <SectionHeader as='h3' title={UI_STRINGS.academics.contactAndLocation} />
      {streetAddress && (
        <Box className='ui-stack gap-0.5 ui-above-inside'>
          <Text className='ui-label'>{UI_STRINGS.academics.address}</Text>
          <NextLink
            href={streetAddress}
            className='button link w-fit break-all items-start'
          >
            {streetAddress}
          </NextLink>
        </Box>
      )}
      {telephone && (
        <Box className='ui-stack gap-0.5 ui-above-inside'>
          <Text className='ui-label'>
            {UI_STRINGS.academics.professor.phone}
          </Text>
          <Text className='ui-body'>{telephone}</Text>
        </Box>
      )}
      {email && (
        <Box className='ui-stack gap-0.5 ui-above-inside'>
          <Text className='ui-label'>
            {UI_STRINGS.academics.professor.email}
          </Text>
          <NextLink
            href={`mailto:${email}`}
            className='button link w-fit break-all items-start'
          >
            {email}
          </NextLink>
        </Box>
      )}
      {website && (
        <Box className='ui-stack gap-0.5 ui-above-inside'>
          <Text className='ui-label'>
            {UI_STRINGS.academics.professor.website}
          </Text>
          <NextLink
            href={website}
            className='button link break-all items-start w-fit'
          >
            {website}
          </NextLink>
        </Box>
      )}
    </Card>
  )
}
