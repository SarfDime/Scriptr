import { UI_STRINGS_PACK } from '@shared/config/strings'
import type { ReactNode } from 'react'
import { Box } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { Avatar } from '@/components/ui/Avatar'
import { Divider } from '@/components/ui/Divider'
import { getServerStrings } from '@/lib/server-strings'
import { IMAGE_SIZES } from '@/styles/style'
import type { ProfessorDetail } from '@/types/academics/professor.types'

type ProfessorContactCardProps = Pick<
  ProfessorDetail,
  'office' | 'telephone' | 'email' | 'website' | 'picture' | 'name'
> & {
  /** Extra content shown under the details, e.g. the ratings block. */
  children?: ReactNode
}

export const ProfessorContactCard = async ({
  office,
  telephone,
  email,
  website,
  picture,
  name,
  children,
}: ProfessorContactCardProps) => {
  const ui = await getServerStrings(UI_STRINGS_PACK)
  if (!office && !telephone && !email && !website && !children) return null

  return (
    <Box className='ui-stack ui-above'>
      <Box className='ui-cluster'>
        {picture && (
          // The avatar fills its box (`h-full aspect-square`), so the box is
          // sized here: an unsized one in this wrapping row collapses.
          <Box className='relative h-28 w-28 shrink-0 overflow-hidden rounded-md'>
            <Avatar
              name={name}
              picture={{ ...picture, sizes: IMAGE_SIZES.LARGE_AVATAR }}
            />
          </Box>
        )}
        <Box className='ui-stack gap-2'>
          {office && (
            <Box className='ui-stack gap-0.5'>
              <Text className='ui-label'>{ui.academics.professor.office}</Text>
              <Text className='ui-body'>{office}</Text>
            </Box>
          )}
          {telephone && (
            <Box className='ui-stack gap-0.5'>
              <Text className='ui-label'>{ui.academics.professor.phone}</Text>
              <Text className='ui-body'>{telephone}</Text>
            </Box>
          )}
          {email && (
            <Box className='ui-stack gap-0.5'>
              <Text className='ui-label'>{ui.academics.professor.email}</Text>
              <NextLink
                href={`mailto:${email}`}
                className='ui-body break-all button link w-fit'
              >
                {email}
              </NextLink>
            </Box>
          )}
          {website && (
            <Box className='ui-stack gap-0.5'>
              <Text className='ui-label'>{ui.academics.professor.website}</Text>
              <NextLink
                href={website}
                className='ui-body break-all text-brand hover:underline'
              >
                {website}
              </NextLink>
            </Box>
          )}
        </Box>
      </Box>

      <Divider />
      {children}
    </Box>
  )
}
