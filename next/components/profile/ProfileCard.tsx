import Book from '@sanity/icons/Book'
import Home from '@sanity/icons/Home'
import Users from '@sanity/icons/Users'
import { UI_STRINGS } from '@shared/config/strings'
import type { ReactNode } from 'react'
import { Box, type BoxPropsWithoutChildren } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import type {
  ProfileAcademicEntry,
  ProfileAcademics,
} from '@/types/components/ProfileCard.types'
import type { NextImageProps } from '../common/NextImage'

type ProfileCardProps = {
  name: string
  /** Affiliations with their page paths; see `buildProfileAcademics`. */
  academics: ProfileAcademics
  picture?: NextImageProps
  /** Rendered with the avatar (beside it on mobile, below it on desktop). */
  badges?: ReactNode
} & BoxPropsWithoutChildren

const AcademicEntryLink = ({ entry }: { entry: ProfileAcademicEntry }) =>
  entry.href ? (
    <NextLink href={entry.href} className='ui-body button link justify-start'>
      {entry.name}
    </NextLink>
  ) : (
    <Text className='ui-body'>{entry.name}</Text>
  )

export const ProfileCard = ({
  name,
  academics,
  picture,
  badges,
  className,
  ...props
}: ProfileCardProps) => {
  const color = getColorPalette({ type: 'seed', value: name })
  const { universities, faculties, studies } = academics

  return (
    <Card {...props} className={cn('ui-above relative z-10 block', className)}>
      {/* Below `lg` (where PageLayout stacks its columns) the avatar group is a
          row with the academics full-width underneath. From `lg` the group is a
          narrow column (avatar, badges wrapping under it) with the academics to
          its right. */}
      <Card.Body className='flex flex-col items-start gap-4 lg:flex-row'>
        <Box className='flex items-start gap-3 lg:max-w-24 lg:flex-col'>
          {/* The avatar fills its box (`h-full aspect-square`), so the box has to
              be sized — an unsized flex item collapses to 0×0. */}
          <Box className='relative h-20 w-20 shrink-0 overflow-hidden rounded-lg'>
            <Avatar name={name} picture={picture} color={color} />
          </Box>
          {badges}
        </Box>
        <Box className='ui-stack ui-above-inside w-full grow lg:w-auto'>
          {!faculties.length && !studies.length && (
            <Text className='ui-caption'>
              {UI_STRINGS.profile.noAcademicAffiliations}
            </Text>
          )}
          {universities.length > 0 && (
            <Box className='ui-cluster items-start gap-2'>
              <Home className='cp-blue rounded-sm p-0.5' />
              <Box className='ui-stack gap-0'>
                <Text className='ui-label'>
                  {UI_STRINGS.profile.universities}
                </Text>
                {universities.map((university) => (
                  <AcademicEntryLink key={university.id} entry={university} />
                ))}
              </Box>
            </Box>
          )}

          {faculties.length > 0 && (
            <Box className='ui-cluster items-start gap-2'>
              <Users className='cp-amber rounded-sm p-0.5' />
              <Box className='ui-stack gap-0'>
                <Text className='ui-label'>{UI_STRINGS.profile.faculties}</Text>
                {faculties.map((faculty) => (
                  <AcademicEntryLink key={faculty.id} entry={faculty} />
                ))}
              </Box>
            </Box>
          )}

          {studies.length > 0 && (
            <Box className='ui-cluster items-start gap-2'>
              <Book className='cp-green rounded-sm p-0.5' />
              <Box className='ui-stack gap-0'>
                <Text className='ui-label'>{UI_STRINGS.profile.studies}</Text>
                {studies.map((study) => (
                  <AcademicEntryLink key={study.id} entry={study} />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Card.Body>
    </Card>
  )
}
