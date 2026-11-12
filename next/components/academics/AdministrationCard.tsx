import type { ReactNode } from 'react'
import { getAcademicPath } from '@/lib/academic-routes'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import { catalogUrl } from '@/lib/study-origin'
import type { MinimalProfessor } from '@/types/academics/professor.types'
import type { ComponentColorPalettes } from '@/types/components/ColorPalettes.types'
import { Box } from '../common/Box'
import { Text } from '../typography/Text'
import { Title } from '../typography/Title'
import { Avatar } from '../ui/Avatar'
import { Card, ClickableCard } from '../ui/Card'
import { Divider } from '../ui/Divider'

type AdministrationItemProps = Pick<MinimalProfessor, 'name' | 'picture'> & {
  id?: string
  subtitle?: ReactNode
  slug?: string | null
  color?: ComponentColorPalettes
  children?: ReactNode
}

const AdministrationCardBody = ({
  name,
  subtitle,
  picture,
  color,
  children,
}: Omit<AdministrationItemProps, '_id'>) => (
  <Card.Body
    className={cn(
      color,
      'ui-cluster items-start flex-nowrap p-1 bg-transparent! bg-none! border-0! w-full'
    )}
  >
    <Box className='relative h-10 w-10 shrink-0 overflow-hidden rounded-md'>
      <Avatar picture={picture} name={name} color={color} />
    </Box>

    <Box className='ui-stack gap-0.5 w-full overflow-hidden'>
      <Title
        as='h3'
        className='ui-body-strong group-hover:text-current truncate'
      >
        {name}
      </Title>

      {subtitle && (
        <Text className='ui-caption truncate group-hover:text-current/70'>
          {subtitle}
        </Text>
      )}
      {subtitle && children && (
        <Divider className='my-2 group-hover:cp-divider' />
      )}
      {children}
    </Box>
  </Card.Body>
)

const ADMINISTRATION_ITEM_WRAPPER_CLASS = ' items-start ui-above-inside p-2'

export const AdministrationCard = ({
  color,
  name,
  subtitle,
  picture,
  slug,
  id,
  children,
}: AdministrationItemProps) => {
  const colorPalette =
    color ?? getColorPalette({ type: 'seed', value: id ?? slug ?? name })

  return (
    <>
      {slug ? (
        <ClickableCard
          href={catalogUrl(
            getAcademicPath({
              type: 'professor',
              professorSlug: slug,
            })
          )}
          className={cn(ADMINISTRATION_ITEM_WRAPPER_CLASS, 'button group')}
        >
          <AdministrationCardBody
            name={name}
            subtitle={subtitle}
            picture={picture}
            color={colorPalette}
            slug={slug}
          >
            {children}
          </AdministrationCardBody>
        </ClickableCard>
      ) : (
        <Card className={ADMINISTRATION_ITEM_WRAPPER_CLASS}>
          <AdministrationCardBody
            name={name}
            subtitle={subtitle}
            picture={picture}
            color={colorPalette}
          >
            {children}
          </AdministrationCardBody>
        </Card>
      )}
    </>
  )
}
