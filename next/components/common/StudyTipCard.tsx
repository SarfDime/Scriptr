import Sparkles from '@sanity/icons/Sparkles'
import { Text } from '../typography/Text'
import { Card } from '../ui/Card'

export const StudyTipCard = () => {
  return (
    <Card className='mt-5 ui-palette-amber p-4'>
      <Card.Header className='flex items-center gap-2 p-0'>
        <Sparkles className='text-golden-yellow' />
        <Text className='text-sm font-medium'>Study tip</Text>
      </Card.Header>
      <Card.Body className='mt-3 p-0'>
        <Text className='text-sm leading-6 text-fg-400'>
          Try explaining one concept from memory before checking your notes. It
          makes review stick.
        </Text>
      </Card.Body>
    </Card>
  )
}
