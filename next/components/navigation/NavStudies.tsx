'use client'

import BookIcon from '@sanity/icons/Book'
import EnterRight from '@sanity/icons/EnterRight'
import { UI_STRINGS } from '@shared/config/strings'
import { getStudyFeedPath, getStudyPath } from '@/lib/academic-routes'
import { useMyProfile } from '@/providers/ProfileProvider'
import { IMAGE_SIZES } from '@/styles/style'
import type { NavStudyLogos } from '@/types/components/Nav.types'
import { Box } from '../common/Box'
import { NextImage } from '../common/NextImage'
import { NextLink } from '../common/NextLink'
import { Text } from '../typography/Text'
import { Divider } from '../ui/Divider'

/**
 * The viewer's enrolled studies, taken from the profile the app already loads.
 * Each study links to its own site with its scripts nested underneath, so the
 * two places a reader returns to are one click away from anywhere. Hidden for
 * guests, while the profile loads, and when there is nothing enrolled — the
 * catalog at `/` is then the way in.
 *
 * The logo comes from the catalog map the layout hands down (a profile row has
 * no logo of its own); a study without one falls back to the book icon.
 */
export const NavStudies = ({ studyLogos }: { studyLogos?: NavStudyLogos }) => {
  const profileState = useMyProfile()
  if (profileState.status !== 'loaded') return null

  const studies = profileState.profile.selected_studies.flatMap(({ study }) =>
    study?.site_slug ? [study] : []
  )
  if (studies.length === 0) return null

  return (
    <Box
      as='section'
      aria-label={UI_STRINGS.navigation.studies}
      className='ui-stack gap-1'
    >
      <Text className='ui-nav-caption px-2.5'>
        {UI_STRINGS.navigation.studies}
      </Text>
      {studies.map((study) => {
        const logo = study.site_slug ? studyLogos?.[study.site_slug] : undefined

        return (
          <Box key={study.id} className='ui-stack gap-0.5'>
            <NextLink
              href={getStudyPath(study.site_slug)}
              className='button ghost w-full justify-start gap-2 p-2'
            >
              {logo ? (
                <Box aria-hidden='true' className='h-6 w-6 shrink-0'>
                  <NextImage
                    {...logo}
                    alt={study.name}
                    fillProp
                    sizes={IMAGE_SIZES.AVATAR}
                    className='h-6 w-6 rounded-full'
                    objectFitProp='cover'
                  />
                </Box>
              ) : (
                <BookIcon aria-hidden='true' className='h-6 w-6 shrink-0' />
              )}
              <Text className='ui-large-caption truncate'>{study.name}</Text>
            </NextLink>
            <NextLink
              href={getStudyFeedPath(study.site_slug)}
              className='button link text-fg button-sm w-full justify-start gap-2 py-1 pl-4'
            >
              <EnterRight aria-hidden='true' className='shrink-0' />
              <Text className='truncate'>{UI_STRINGS.navigation.scripts}</Text>
            </NextLink>
          </Box>
        )
      })}
      <Divider className='my-2' />
    </Box>
  )
}
