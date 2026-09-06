import Book from '@sanity/icons/Book'
import Confetti from '@sanity/icons/Confetti'
import { cn } from '@/lib/common-utils'
import { Box, type BoxProps } from '../common/Box'
import { Text } from '../typography/Text'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

type ProfileCardProps = {
  name: string
  role: string
  bio: string
  university: string
  faculty: string
  location: string
} & BoxProps

export const ProfileCard = ({
  name,
  role,
  bio,
  university,
  faculty,
  location,
  className,
  ...props
}: ProfileCardProps) => {
  const accent = 'cp-blue'
  const initials = name // TODO: Factor out to util, and use profile photo if not then initials
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <Card {...props} className={cn('p-6', className)}>
      <Card.Body className='flex gap-4 grow-0'>
        <Box
          className={cn(
            'h-full aspect-square rounded-2xl ui-center p-6',
            accent
          )}
        >
          {initials}
        </Box>

        <Box className='ui-stack gap-1'>
          <Box className='flex flex-wrap items-center gap-2'>
            <Text className='ui-label'>{location}</Text>
            {role && <Badge colorPalette={accent}>{role}</Badge>}
          </Box>
          <Text className='ui-body'>{bio}</Text>
        </Box>
      </Card.Body>

      <Card.Footer className='ui-cluster'>
        <Box className='ui-cluster'>
          <Book />
          <Box className='ui-stack gap-0'>
            <Text className='ui-label'>University</Text>
            <Text className='ui-body'>{university}</Text>
          </Box>
        </Box>

        <Box className='ui-cluster'>
          <Confetti className='mt-0.5 text-[#d3b775]' />
          <Box className='ui-stack gap-0'>
            <Text className='ui-label'>Faculty</Text>
            <Text className='ui-body'>{faculty}</Text>
          </Box>
        </Box>
      </Card.Footer>
    </Card>
  )
}
