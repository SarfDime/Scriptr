import { UI_STRINGS } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import type { UniversityDetail } from '@/types/academics/university.types'
import { AdministrationCard } from '../AdministrationCard'

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
      <SectionHeader as='h3' title={UI_STRINGS.academics.administration} />
      {rector && (
        <AdministrationCard
          name={rector.name}
          subtitle={rector.title}
          picture={rector.picture}
          id={rector._id}
        />
      )}
      <Divider />
      {viceRectors && viceRectors.length > 0 && (
        <Box className='ui-stack gap-2'>
          {viceRectors.map((viceRector) => (
            <AdministrationCard
              key={viceRector._id}
              id={viceRector._id}
              name={viceRector.name}
              subtitle={viceRector.title}
              picture={viceRector.picture}
            />
          ))}
        </Box>
      )}
    </Card>
  )
}
