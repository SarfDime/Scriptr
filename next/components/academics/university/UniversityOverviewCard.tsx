import { SectionHeader } from '@/components/common/SectionHeader'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Card } from '@/components/ui/Card'
import type { UniversityDetail } from '@/types/academics/university.types'

export const UniversityOverviewCard = ({
  university,
}: {
  university: UniversityDetail
}) => (
  <Card className='ui-stack ui-above'>
    <SectionHeader title={`About ${university.name}`} />
    {university.description && (
      <PortableTextContent className='ui-above-inside'>
        {university.description}
      </PortableTextContent>
    )}
  </Card>
)
