import { Box } from '@/components/common/Box'
import { NextImage } from '@/components/common/NextImage'
import { PortableTextContent } from '@/components/typography/PortableTextContent'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import { cn } from '@/lib/common-utils'
import type { OverviewCardProps } from '@/types/components/OverviewCard.types'
import { AdministratorList } from './OverviewAdministratorList'
import { OverviewCardAction } from './OverviewCardAction'

export const OverviewCard = ({
  picture,
  imageAlt,
  administrators = [],
  headerContent,
  eyebrow,
  eyebrowIcon,
  description,
  actions = [],
  className,
  ...boxProps
}: OverviewCardProps) => {
  return (
    <Card
      className={cn(
        'grid lg:grid-cols-[1.08fr_0.92fr] overflow-hidden p-0',
        className
      )}
      {...boxProps}
    >
      <Card.Header className='relative min-h-80 overflow-hidden border-b-0 px-5 py-5 lg:border-r border-grey-300/20'>
        {picture && (
          <NextImage
            {...picture}
            alt={imageAlt ?? ''}
            className='absolute inset-0 h-full w-full object-cover'
            fillProp
          />
        )}

        <Box className='absolute inset-0 bg-linear-to-tr from-background-100/85 via-background-100/35 to-background-100/10' />

        <Box className='relative z-10 justify-end h-full ui-stack gap-2'>
          {headerContent ?? (
            <AdministratorList administrators={administrators} />
          )}
        </Box>
      </Card.Header>

      <Card.Body className='flex flex-col justify-between p-6 ui-stack gap-6'>
        <Box className='ui-stack gap-3'>
          <Box className='flex items-center justify-between gap-4'>
            <Text className='ui-caption uppercase tracking-[0.16em] font-bold text-grey-500'>
              {eyebrow}
            </Text>
            {eyebrowIcon && (
              <Box className='shrink-0 w-5 h-5 text-golden-yellow'>
                {eyebrowIcon}
              </Box>
            )}
          </Box>

          {description && (
            <PortableTextContent className='ui-body text-fg-400'>
              {description}
            </PortableTextContent>
          )}
        </Box>

        <Divider className='mt-auto' />

        {actions.length > 0 && (
          <Box className='ui-cluster'>
            {actions.map((action) => (
              <OverviewCardAction key={action.key} action={action} />
            ))}
          </Box>
        )}
      </Card.Body>
    </Card>
  )
}
