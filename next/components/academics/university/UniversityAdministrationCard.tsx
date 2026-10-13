import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import type { UniversityDetail } from '@/types/academics/university.types'

type UniversityAdministrationCardProps = Pick<
  UniversityDetail,
  'rector' | 'viceRectors'
>

export const UniversityAdministrationCard = ({
  rector,
  viceRectors,
}: UniversityAdministrationCardProps) => {
  if (!rector && (!viceRectors || viceRectors.length === 0)) return null

  return (
    <Card className='ui-stack ui-above'>
      <SectionHeader as='h3' title='Administration' />
      {rector && (
        <Box className='ui-stack gap-0.5 ui-above-inside'>
          <Text className='ui-label'>Rector</Text>
          <Text className='ui-body-strong'>{rector.name}</Text>
          {rector.title && <Text className='ui-caption'>{rector.title}</Text>}
        </Box>
      )}
      {viceRectors && viceRectors.length > 0 && (
        <Box className='ui-stack ui-above-inside'>
          <Text className='ui-label'>Vice Rectors</Text>
          {viceRectors.map((viceRector) => (
            <Box key={viceRector._id} className='ui-stack gap-0.5'>
              <Text className='ui-body-strong'>{viceRector.name}</Text>
              {viceRector.title && (
                <Text className='ui-caption'>{viceRector.title}</Text>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Card>
  )
}
