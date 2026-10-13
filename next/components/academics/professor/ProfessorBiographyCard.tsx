import { UI_STRINGS } from '@shared/config/strings'
import { SectionHeader } from '@/components/common/SectionHeader'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Card } from '@/components/ui/Card'
import type { ProfessorDetail } from '@/types/academics/professor.types'

export const ProfessorBiographyCard = ({
  bio,
}: Pick<ProfessorDetail, 'bio'>) => {
  if (!bio) return null

  return (
    <Card className='ui-stack gap-4 ui-above'>
      <SectionHeader title={UI_STRINGS.academics.professor.biography} />
      <PortableTextContent>{bio}</PortableTextContent>
    </Card>
  )
}
