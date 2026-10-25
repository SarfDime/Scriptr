import Sparkles from '@sanity/icons/Sparkles'
import type { StudyTipData } from '@/types/components/StudyTipCard.types'
import { PortableTextContent } from '../typography/PortableTextContent'
import { Card } from '../ui/Card'
import { SectionHeader } from './SectionHeader'

export const StudyTipCard = ({ title, content }: StudyTipData) => {
  return (
    <Card className='ui-stack gap-3 p-4 ui-above-inside border-none'>
      <Card.Header className='p-0'>
        <SectionHeader
          as='h3'
          title={title}
          icon={Sparkles}
          iconProps={{ className: 'text-golden-yellow' }}
        />
      </Card.Header>
      <Card.Body className='p-0'>
        <PortableTextContent className='ui-body'>{content}</PortableTextContent>
      </Card.Body>
    </Card>
  )
}
