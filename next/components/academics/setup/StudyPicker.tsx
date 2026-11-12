'use client'

import { UI_STRINGS } from '@shared/config/strings'
import type { StudyPickerQueryResult } from '@shared/types/sanity.types'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { OnboardingSelectStep } from '@/components/onboarding/OnboardingSelectStep'
import { Text } from '@/components/typography/Text'
import { getStudySetupUrl } from '@/lib/academic-routes'
import { useSession } from '@/providers/SessionProvider'

export type StudyPickerCatalog = NonNullable<StudyPickerQueryResult>

/**
 * The first thing a new reader does: university → faculty → study. It offers
 * names and slugs only — no subjects, no academic profile — because the study
 * they pick owns that and its setup page asks for it.
 *
 * The choose handler sends the reader straight to that study's setup, which is
 * also where the study's own gate would take them.
 *
 * A signed-in reader's own studies stay in the list — they can look — but they
 * cannot continue into one: they already have an academic profile there, and
 * the setup page it would land on is the one that updates it.
 */
export const StudyPicker = ({ catalog }: { catalog: StudyPickerCatalog }) => {
  const router = useRouter()
  const { session } = useSession()
  const [universityId, setUniversityId] = useState<string | null>(null)
  const [facultyId, setFacultyId] = useState<string | null>(null)
  const [studyId, setStudyId] = useState<string | null>(null)

  const joinedStudyIds = new Set(
    session.status === 'authenticated' ? session.user.selected_study_ids : []
  )

  const faculties = catalog.faculties.filter(
    (faculty) => faculty.universityId === universityId
  )
  const studies = catalog.studies.filter(
    (study) => study.facultyId === facultyId
  )
  const selectedStudy = catalog.studies.find((study) => study._id === studyId)
  const isJoined = Boolean(
    selectedStudy && joinedStudyIds.has(selectedStudy.dbId)
  )

  const chooseUniversity = (nextId: string) => {
    setUniversityId(nextId)
    setFacultyId(null)
    setStudyId(null)
  }

  const chooseFaculty = (nextId: string) => {
    setFacultyId(nextId)
    setStudyId(null)
  }

  const enter = () => {
    if (!selectedStudy?.siteSlug || isJoined) return
    // The setup page belongs to the study's own site, which the picker is
    // not on: this has to be the study's address, not a path here.
    router.push(getStudySetupUrl(selectedStudy.siteSlug))
  }

  if (catalog.studies.length === 0) {
    return (
      <p className='ui-caption'>{UI_STRINGS.onboarding.studySelection.empty}</p>
    )
  }

  return (
    <Box className='ui-stack ui-above'>
      <OnboardingSelectStep
        title={UI_STRINGS.onboarding.universityTitle}
        options={catalog.universities.map((university) => ({
          id: university._id,
          name: university.name,
        }))}
        selectedId={universityId}
        onSelect={chooseUniversity}
      />
      <OnboardingSelectStep
        title={UI_STRINGS.onboarding.facultyTitle}
        options={faculties.map((faculty) => ({
          id: faculty._id,
          name: faculty.name,
        }))}
        selectedId={facultyId}
        onSelect={chooseFaculty}
        disabledReason={
          universityId ? undefined : UI_STRINGS.onboarding.selectUniversityFirst
        }
      />
      <OnboardingSelectStep
        title={UI_STRINGS.onboarding.studyTitle}
        options={studies.map((study) => ({
          id: study._id,
          name: study.name,
        }))}
        selectedId={studyId}
        onSelect={setStudyId}
        disabledReason={
          facultyId ? undefined : UI_STRINGS.onboarding.selectFacultyFirst
        }
      />
      {/* One wrapping row: the reason sits beside Continue and drops under it
       * when there is no room, instead of pushing the button down on its own. */}
      <Box className='ui-cluster gap-2'>
        <Button
          className='button solid w-fit'
          disabled={!selectedStudy?.siteSlug || isJoined}
          onClick={enter}
        >
          {UI_STRINGS.onboarding.continue}
        </Button>
        {isJoined && selectedStudy?.siteSlug && (
          <Text className='ui-caption'>
            {UI_STRINGS.onboarding.studySelection.alreadyAdded}{' '}
            <NextLink
              href={getStudySetupUrl(selectedStudy.siteSlug)}
              className='text-brand underline-offset-2 hover:underline'
            >
              {UI_STRINGS.onboarding.studySelection.alreadyAddedEdit}
            </NextLink>
          </Text>
        )}
      </Box>
    </Box>
  )
}
