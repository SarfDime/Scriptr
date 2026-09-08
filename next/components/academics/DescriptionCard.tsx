import { cn } from '@/lib/common-utils'
import type { PortableTextType } from '@/types/components/PortableText.types'
import { PortableTextContent } from '../typography/PortableTextContent'
import { Title } from '../typography/Title'
import { Card } from '../ui/Card'

export type DescriptionCardProps = {
  title?: string
  description?: PortableTextType
  className?: string
}

export const DescriptionCard = ({
  title,
  description,
  className,
}: DescriptionCardProps) => {
  if (!description) {
    return null
  }

  return (
    <Card className={cn('p-6 ui-stack gap-3', className)}>
      {title && (
        <Title as='h2' className='ui-title font-bold'>
          {title}
        </Title>
      )}
      <PortableTextContent>{description}</PortableTextContent>
    </Card>
  )
}
