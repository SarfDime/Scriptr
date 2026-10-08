import type { PortableTextValue } from '@shared/types/portable-text.types'
import { cn } from '@/lib/common-utils'
import { SectionHeader } from '../common/SectionHeader'
import { PortableTextContent } from '../typography/PortableTextContent'
import { Card } from '../ui/Card'

export type DescriptionCardProps = {
  title?: string
  description?: PortableTextValue
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
      {title && <SectionHeader title={title} />}
      <PortableTextContent>{description}</PortableTextContent>
    </Card>
  )
}
