import Book from '@sanity/icons/Book'
import Home from '@sanity/icons/Home'
import Users from '@sanity/icons/Users'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import type { ReactNode } from 'react'
import { Box, type BoxPropsWithoutChildren } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Text } from '@/components/typography/Text'
import { Avatar } from '@/components/ui/Avatar'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import { getServerStrings } from '@/lib/server-strings'
import type {
  ProfileAcademicEntry,
  ProfileAcademics,
} from '@/types/components/ProfileCard.types'
import { ActivityStats } from '../common/ActivityStats'
import type { NextImageProps } from '../common/NextImage'

type ProfileCardProps = {
  name: string
  /** Affiliations with their page paths; see `buildProfileAcademics`. */
  academics: ProfileAcademics
  picture?: NextImageProps
  /** Rendered with the avatar (beside it on mobile, below it on desktop). */
  badges?: ReactNode
  authoredCount?: number
  commentCount?: number
  favoriteCount?: number
} & BoxPropsWithoutChildren

const AcademicEntryLink = ({ entry }: { entry: ProfileAcademicEntry }) =>
  entry.href ? (
    <NextLink href={entry.href} className='ui-body button link justify-start'>
      {entry.name}
    </NextLink>
  ) : (
    <Text className='ui-body'>{entry.name}</Text>
  )

/** One affiliation level: its icon, its label and its entries. No wrapping
 * between icon and text, so a long name wraps inside its own column instead of
 * pushing the icon onto a line of its own. */
const AcademicGroup = ({
  icon,
  label,
  entries,
}: {
  icon: ReactNode
  label: string
  entries: Array<ProfileAcademicEntry>
}) => (
  <Box className='flex items-start gap-2'>
    {icon}
    <Box className='ui-stack min-w-0 gap-0'>
      <Text className='ui-label'>{label}</Text>
      {entries.map((entry) => (
        <AcademicEntryLink key={entry.id} entry={entry} />
      ))}
    </Box>
  </Box>
)

export const ProfileCard = async ({
  name,
  academics,
  picture,
  badges,
  className,
  authoredCount,
  commentCount,
  favoriteCount,
  ...props
}: ProfileCardProps) => {
  const ui = await getServerStrings(UI_STRINGS_PACK)
  const color = getColorPalette({ type: 'seed', value: name })
  const { universities, faculties, studies } = academics

  return (
    <Box
      as='section'
      {...props}
      className={cn(
        'ui-above ui-cluster relative z-2 items-stretch',
        className
      )}
    >
      <Box className='flex items-start gap-3 lg:max-w-24 lg:flex-col'>
        {/* The avatar fills its box (`h-full aspect-square`), so the box has to
            be sized — an unsized flex item collapses to 0×0. */}
        <Box className='relative h-20 w-20 shrink-0 overflow-hidden rounded-lg'>
          <Avatar name={name} picture={picture} color={color} />
        </Box>
        {badges}
      </Box>
      {authoredCount !== undefined && commentCount !== undefined && (
        <ActivityStats
          savedCount={favoriteCount}
          authoredCount={authoredCount}
          commentCount={commentCount}
        />
      )}
      <Box
        as='section'
        className='ui-stack ui-above-inside grow-2 basis-72 gap-3'
      >
        <SectionHeader title={ui.profile.academics.sectionTitle} />
        <Box className='ui-stack flex-1 justify-between gap-3'>
          {universities.length === 0 &&
            faculties.length === 0 &&
            studies.length === 0 && (
              <Text className='ui-caption'>
                {ui.profile.noAcademicAffiliations}
              </Text>
            )}
          {universities.length > 0 && (
            <AcademicGroup
              icon={<Home className='cp-blue shrink-0 rounded-md p-0.5' />}
              label={ui.profile.universities}
              entries={universities}
            />
          )}
          {faculties.length > 0 && (
            <AcademicGroup
              icon={<Users className='cp-amber shrink-0 rounded-md p-0.5' />}
              label={ui.profile.faculties}
              entries={faculties}
            />
          )}
          {studies.length > 0 && (
            <AcademicGroup
              icon={<Book className='cp-green shrink-0 rounded-md p-0.5' />}
              label={ui.profile.studies}
              entries={studies}
            />
          )}
        </Box>
      </Box>
    </Box>
  )
}
