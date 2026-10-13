import Book from '@sanity/icons/Book'
import Home from '@sanity/icons/Home'
import Users from '@sanity/icons/Users'
import { UI_STRINGS } from '@shared/config/strings'
import type {
  FacultyWithUniversity,
  StudyWithFacultyAndUniversity,
} from '@shared/types/profile.types'
import { Box, type BoxProps } from '@/components/common/Box'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { getAcademicPath } from '@/lib/academic-routes'
import { getColorPalette } from '@/lib/color-pallette-gen'
import { cn } from '@/lib/common-utils'
import type { NextImageProps } from '../common/NextImage'

type ProfileCardProps = {
  name: string
  role: string
  selectedFaculties: Array<{ faculty: FacultyWithUniversity | null }>
  selectedStudies: Array<{ study: StudyWithFacultyAndUniversity | null }>
  picture?: NextImageProps
} & BoxProps

export const ProfileCard = ({
  name,
  selectedFaculties,
  selectedStudies,
  picture,
  className,
  ...props
}: ProfileCardProps) => {
  const color = getColorPalette({ type: 'seed', value: name })
  const faculties = selectedFaculties.flatMap(({ faculty }) =>
    faculty ? [faculty] : []
  )
  // TODO: Get slugs for academics from sanity instead of id, since it wont work with id
  const studies = selectedStudies.flatMap(({ study }) => (study ? [study] : []))
  const universities = [
    ...new Map(
      [
        ...faculties.map((faculty) => faculty.university),
        ...studies.map((study) => study.faculty?.university ?? null),
      ]
        .filter((university) => university !== null)
        .map((university) => [university.id, university] as const)
    ).values(),
  ]

  return (
    <Card {...props} className={cn('ui-above block', className)}>
      <Card.Body className='ui-cluster items-start gap-4'>
        <Avatar name={name} picture={picture} color={color} />
        <Box className='ui-stack ui-above-inside grow'>
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
                  <NextLink
                    key={university.id}
                    href={getAcademicPath({
                      type: 'university',
                      universitySlug: university.id,
                    })}
                    className='ui-body button link justify-start'
                  >
                    {university.name}
                  </NextLink>
                ))}
              </Box>
            </Box>
          )}

          {faculties.length > 0 && (
            <Box className='ui-cluster items-start gap-2'>
              <Users className='cp-amber rounded-sm p-0.5' />
              <Box className='ui-stack gap-0'>
                <Text className='ui-label'>{UI_STRINGS.profile.faculties}</Text>
                {faculties.map((faculty) => {
                  const universityId = faculty.university?.id
                  return universityId ? (
                    <NextLink
                      key={faculty.id}
                      href={getAcademicPath({
                        type: 'faculty',
                        universitySlug: universityId,
                        facultySlug: faculty.id,
                      })}
                      className='ui-body button link justify-start'
                    >
                      {faculty.name}
                    </NextLink>
                  ) : (
                    <Text key={faculty.id} className='ui-body'>
                      {faculty.name}
                    </Text>
                  )
                })}
              </Box>
            </Box>
          )}

          {studies.length > 0 && (
            <Box className='ui-cluster items-start gap-2'>
              <Book className='cp-green rounded-sm p-0.5' />
              <Box className='ui-stack gap-0'>
                <Text className='ui-label'>{UI_STRINGS.profile.studies}</Text>
                {studies.map((study) => {
                  const faculty = study.faculty
                  const universityId = faculty?.university?.id
                  return faculty && universityId ? (
                    <NextLink
                      key={study.id}
                      href={getAcademicPath({
                        type: 'study',
                        universitySlug: universityId,
                        facultySlug: faculty.id,
                        studySlug: study.id,
                      })}
                      className='ui-body button link justify-start'
                    >
                      {study.name}
                    </NextLink>
                  ) : (
                    <Text key={study.id} className='ui-body'>
                      {study.name}
                    </Text>
                  )
                })}
              </Box>
            </Box>
          )}
        </Box>
      </Card.Body>
    </Card>
  )
}
