import Sparkles from '@sanity/icons/Sparkles'
import { UI_STRINGS } from '@shared/config/strings'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import { DEFAULT_STUDY_TIP_CONTENT } from '@/config/content'
import { PortableTextContent } from '../typography/PortableTextContent'
import { Card } from '../ui/Card'
import { SectionHeader } from './SectionHeader'

export const StudyTipCard = ({
  content = DEFAULT_STUDY_TIP_CONTENT,
}: {
  content?: PortableTextValue
}) => {
  return (
    <Card className='ui-stack gap-3 p-4 ui-above-inside border-none'>
      <Card.Header className='p-0'>
        <SectionHeader
          as='h3'
          title={UI_STRINGS.general.studyTip}
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
