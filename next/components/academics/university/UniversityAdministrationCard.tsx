import { UI_STRINGS_PACK } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Divider } from '@/components/ui/Divider'
import { getServerStrings } from '@/lib/server-strings'
import type { UniversityDetail } from '@/types/academics/university.types'
import { AdministrationCard } from '../AdministrationCard'

type UniversityAdministrationCardProps = Pick<
  UniversityDetail,
  'rector' | 'viceRectors'
>

export const UniversityAdministrationCard = async ({
  rector,
  viceRectors,
}: UniversityAdministrationCardProps) => {
  const ui = await getServerStrings(UI_STRINGS_PACK)
  if (!rector && (!viceRectors || viceRectors.length === 0)) return null

  return (
    <Box className='ui-stack ui-above'>
      <SectionHeader as='h3' title={ui.academics.administration} />
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
    </Box>
  )
}
