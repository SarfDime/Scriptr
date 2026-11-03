import type { SanityImageType } from '@shared/types/sanity-transform.types'
import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import type { UniversityDetail } from '@/types/academics/university.types'

type UniversityAdministrationCardProps = Pick<
  UniversityDetail,
  'rector' | 'viceRectors'
>

const AdministrationItem = ({
  name,
  title,
  picture,
}: {
  name: string
  title?: string
  picture?: SanityImageType
}) => (
  <Box className='ui-cluster ui-above-inside gap-3 p-3'>
    <Avatar name={name} picture={{ ...picture, objectFitProp: 'cover' }} />
    <Box className='ui-stack gap-0.5'>
      <Text className='ui-body-strong'>{name}</Text>
      {title && <Text className='ui-caption'>{title}</Text>}
    </Box>
  </Box>
)

export const UniversityAdministrationCard = ({
  rector,
  viceRectors,
}: UniversityAdministrationCardProps) => {
  if (!rector && (!viceRectors || viceRectors.length === 0)) return null

  return (
    <Card className='ui-stack ui-above'>
      <SectionHeader as='h3' title='Administration' />
      {rector && (
        <AdministrationItem
          name={rector.name}
          title={rector.title}
          picture={rector.picture}
        />
      )}
      <Divider />
      {viceRectors && viceRectors.length > 0 && (
        <Box className='ui-stack gap-2'>
          {viceRectors.map((viceRector) => (
            <AdministrationItem
              key={viceRector._id}
              name={viceRector.name}
              title={viceRector.title}
              picture={viceRector.picture}
            />
          ))}
        </Box>
      )}
    </Card>
  )
}
