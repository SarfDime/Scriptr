'use client'

import { UI_STRINGS } from '@shared/config/strings'
import type { StudyPickerQueryResult } from '@shared/types/sanity.types'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { OnboardingSelectStep } from '@/components/onboarding/OnboardingSelectStep'

export type StudyPickerCatalog = NonNullable<StudyPickerQueryResult>

/**
 * The first thing a new reader does: university → faculty → study. It offers
 * names and slugs only — no subjects, no academic profile — because the study
 * they pick owns that and its setup page asks for it.
 *
 * The choose handler sends the reader straight to that study's setup, which is
 * also where the study's own gate would take them.
 */
export const StudyPicker = ({ catalog }: { catalog: StudyPickerCatalog }) => {
  const router = useRouter()
  const [universityId, setUniversityId] = useState<string | null>(null)
  const [facultyId, setFacultyId] = useState<string | null>(null)
  const [studyId, setStudyId] = useState<string | null>(null)

  const faculties = catalog.faculties.filter(
    (faculty) => faculty.universityId === universityId
  )
  const studies = catalog.studies.filter(
    (study) => study.facultyId === facultyId
  )
  const selectedStudy = catalog.studies.find((study) => study._id === studyId)

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
    if (!selectedStudy?.siteSlug) return
    router.push(`/study/${selectedStudy.siteSlug}/academic-setup`)
  }

  if (catalog.studies.length === 0) {
    return (
      <p className='ui-caption'>{UI_STRINGS.onboarding.studySelection.empty}</p>
    )
  }

  return (
    <Box className='ui-stack gap-3'>
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
      <Button
        className='button solid w-fit'
        disabled={!selectedStudy?.siteSlug}
        onClick={enter}
      >
        {UI_STRINGS.onboarding.continue}
      </Button>
    </Box>
  )
}
