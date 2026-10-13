import { UI_STRINGS } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { IMAGE_SIZES } from '@/styles/style'
import type { ProfessorDetail } from '@/types/academics/professor.types'

type ProfessorContactCardProps = Pick<
  ProfessorDetail,
  'office' | 'telephone' | 'email' | 'website' | 'picture' | 'name'
>

export const ProfessorContactCard = ({
  office,
  telephone,
  email,
  website,
  picture,
  name,
}: ProfessorContactCardProps) => {
  if (!office && !telephone && !email && !website) return null

  return (
    <Card className='ui-stack ui-above'>
      <SectionHeader
        as='h3'
        title={UI_STRINGS.academics.professor.contactDetails}
      />

      <Box className='ui-cluster ui-above-inside'>
        {picture && (
          <Avatar
            name={name}
            picture={{ ...picture, sizes: IMAGE_SIZES.LARGE_AVATAR }}
          />
        )}
        <Box className='ui-stack gap-2'>
          {office && (
            <Box className='ui-stack gap-0.5'>
              <Text className='ui-label'>
                {UI_STRINGS.academics.professor.office}
              </Text>
              <Text className='ui-body'>{office}</Text>
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
              <NextLink
                href={`mailto:${email}`}
                className='ui-body break-all button link w-fit'
              >
                {email}
              </NextLink>
            </Box>
          )}
          {website && (
            <Box className='ui-stack gap-0.5'>
              <Text className='ui-label'>
                {UI_STRINGS.academics.professor.website}
              </Text>
              <NextLink
                href={website}
                className='ui-body break-all text-brand hover:underline'
              >
                {website}
              </NextLink>
            </Box>
          )}
        </Box>
      </Box>
    </Card>
  )
}
