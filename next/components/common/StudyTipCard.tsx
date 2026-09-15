import Sparkles from '@sanity/icons/Sparkles'
import { UI_STRINGS } from '@shared/config/strings'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import { DEFAULT_STUDY_TIP_CONTENT } from '@/config/content'
import { PortableTextContent } from '../typography/PortableTextContent'
import { Text } from '../typography/Text'
import { Card } from '../ui/Card'

export const StudyTipCard = ({
  content = DEFAULT_STUDY_TIP_CONTENT,
}: {
  content?: PortableTextValue
}) => {
  return (
    <Card className='ui-stack gap-3 p-4'>
      <Card.Header className='flex items-center gap-2 p-0'>
        <Sparkles className='text-golden-yellow' />
        <Text className='ui-title'>{UI_STRINGS.general.studyTip}</Text>
      </Card.Header>
      <Card.Body className='p-0'>
        <PortableTextContent className='ui-body'>{content}</PortableTextContent>
      </Card.Body>
    </Card>
  )
}
