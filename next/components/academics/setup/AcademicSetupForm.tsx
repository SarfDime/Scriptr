'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { useRouter } from 'next/navigation'
import { useCallback, useState, useSyncExternalStore } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { OnboardingSubjectsStep } from '@/components/onboarding/OnboardingSubjectsStep'
import { Text } from '@/components/typography/Text'
import { Divider } from '@/components/ui/Divider'
import { useSubjectCompletion } from '@/hooks/onboarding/useSubjectCompletion'
import { getStudyFeedPath } from '@/lib/academic-routes'
import {
  addProfileStudy,
  removeProfileSubject,
  setProfileSubjectStatus,
} from '@/lib/api/profile-api'
import {
  EMPTY_STUDY_SETUP,
  readStudySetup,
  subscribeToStudySetup,
  writeStudySetup,
} from '@/lib/study-setup-storage'
import { useSession } from '@/providers/SessionProvider'
import type { OnboardingSubject } from '@/types/onboarding.types'

export type AcademicSetupSubject = {
  /** Sanity id: what the year/subject picker renders and toggles. */
  _id: string
  /** Postgres id: what `profile_studies` / `profile_subjects` take. */
  dbId: string
  name: string
  year: number
  elective?: boolean | null
}

export type AcademicSetupFormProps = {
  /** The study's handle, for the page it hands the reader back to. */
  siteSlug: string
  /** The study document's id, for the picker's subject shape. */
  studySanityId: string
  /** The study's database id: the key for both the account row and the browser record. */
  studyId: string
  studyName: string
  subjects: Array<AcademicSetupSubject>
  /** The reader is signed in and already has a profile for this study, so this
   * is an update: the form opens on the account's selections and saves a diff. */
  hasProfile?: boolean
  /** The account's completed subjects, as Sanity ids. Empty for a first setup. */
  accountCompletedSubjectIds?: Array<string>
}

const groupByYear = (
  subjects: Array<AcademicSetupSubject>,
  studySanityId: string
): Map<number, Array<OnboardingSubject>> => {
  const byYear = new Map<number, Array<OnboardingSubject>>()

  for (const subject of subjects) {
    const group = byYear.get(subject.year) ?? []
    group.push({ ...subject, studyId: studySanityId })
    byYear.set(subject.year, group)
  }

  return new Map([...byYear.entries()].sort(([left], [right]) => left - right))
}

/**
 * The academic profile for one study: which years, or individual subjects, the
 * reader has finished. Everything it needs is in its props — the study and its
 * subjects are read on the server — so it opens without the catalog round trip
 * the modal needed.
 *
 * A signed-in reader writes straight to `profile_studies` / `profile_subjects`;
 * a guest's record lives in this browser, keyed by the study. "Skip for now"
 * writes the same record's dismissal, which is what makes it per study.
 *
 * Editing is the same write: a member's save applies the difference against
 * what the account already holds, so unticking a subject they had finished
 * removes its status instead of leaving it behind.
 */
export const AcademicSetupForm = ({
  siteSlug,
  studySanityId,
  studyId,
  subjects,
  hasProfile = false,
  accountCompletedSubjectIds = [],
}: AcademicSetupFormProps) => {
  const router = useRouter()
  const { session, refresh } = useSession()
  const [isSaving, setIsSaving] = useState(false)
  const [hasError, setHasError] = useState(false)

  const sanityIdByDbId = new Map(
    subjects.map((subject) => [subject.dbId, subject._id] as const)
  )
  // The browser record is external state, read through a subscription with an
  // empty server snapshot: the server has no record, and seeding state from
  // `localStorage` during render would make the first client render disagree
  // with the server's HTML.
  const subscribe = useCallback(
    (listener: () => void) => subscribeToStudySetup(studyId, listener),
    [studyId]
  )
  const stored = useSyncExternalStore(
    subscribe,
    () => readStudySetup(studyId),
    () => EMPTY_STUDY_SETUP
  )

  // Whatever the reader has toggled in this visit, else where the form opened.
  const [edited, setEdited] = useState<{
    completedYears: Array<number>
    completedSubjectIds: Array<string>
  } | null>(null)

  const subjectsByYear = groupByYear(subjects, studySanityId)

  // A member of this study edits what the account holds, not this browser's
  // record; the account carries subject statuses only, so a year counts as
  // finished when every one of its subjects is.
  const accountYears = [...subjectsByYear.entries()].flatMap(
    ([year, yearSubjects]) =>
      yearSubjects.every((subject) =>
        accountCompletedSubjectIds.includes(subject._id)
      )
        ? [year]
        : []
  )
  const seededSubjectIds = hasProfile
    ? accountCompletedSubjectIds
    : stored.subjectIds.flatMap((dbId) => {
        const sanityId = sanityIdByDbId.get(dbId)
        return sanityId ? [sanityId] : []
      })
  const seededYears = hasProfile ? accountYears : stored.completedYears

  const completedSubjectIds = edited?.completedSubjectIds ?? seededSubjectIds
  const completedYears = edited?.completedYears ?? seededYears

  const completion = useSubjectCompletion(
    subjectsByYear,
    { completedYears, completedSubjectIds },
    (patch) =>
      setEdited({
        completedYears: patch.completedYears ?? completedYears,
        completedSubjectIds: patch.completedSubjectIds ?? completedSubjectIds,
      })
  )

  // Setup exists to shape the feed, so it hands the reader to the feed.
  const studyPath = getStudyFeedPath(siteSlug)
  const isSignedIn = session.status === 'authenticated'

  const dbSubjectIds = completedSubjectIds.flatMap((sanityId) => {
    const subject = subjects.find((candidate) => candidate._id === sanityId)
    return subject ? [subject.dbId] : []
  })
  const subjectDbIds = new Set(subjects.map((subject) => subject.dbId))

  const finish = () => {
    writeStudySetup(studyId, {
      subjectIds: dbSubjectIds,
      completedYears,
      completedAt: new Date().toISOString(),
      dismissedAt: null,
    })
    router.push(studyPath)
    router.refresh()
  }

  const save = async () => {
    setIsSaving(true)
    setHasError(false)
    try {
      if (session.status === 'authenticated') {
        if (!hasProfile) await addProfileStudy(studyId)

        // Only this study's subjects, so another study's statuses are never
        // touched: what is ticked now but was not, and what was completed but
        // is no longer ticked.
        const completedBefore = new Set(
          hasProfile
            ? session.user.subjects.flatMap((subject) =>
                subject.status === 'completed' &&
                subjectDbIds.has(subject.subject_id)
                  ? [subject.subject_id]
                  : []
              )
            : []
        )

        await Promise.all([
          ...dbSubjectIds
            .filter((subjectId) => !completedBefore.has(subjectId))
            .map((subjectId) =>
              setProfileSubjectStatus(subjectId, 'completed')
            ),
          ...[...completedBefore]
            .filter((subjectId) => !dbSubjectIds.includes(subjectId))
            .map((subjectId) => removeProfileSubject(subjectId)),
        ])
        await refresh()
      }
      finish()
    } catch {
      setHasError(true)
    } finally {
      setIsSaving(false)
    }
  }

  const skip = () => {
    writeStudySetup(studyId, { dismissedAt: new Date().toISOString() })
    router.push(studyPath)
    router.refresh()
  }

  return (
    <Box className='ui-stack ui-above'>
      <OnboardingSubjectsStep
        subjectsByYear={subjectsByYear}
        completedYears={completedYears}
        completedSubjectIds={completedSubjectIds}
        onCompleteYear={completion.completeYear}
        onUncompleteYear={completion.uncompleteYear}
        onCompleteSubject={completion.completeSubject}
        onUncompleteSubject={completion.uncompleteSubject}
      />

      <Divider />

      {!isSignedIn && (
        <Text className='ui-caption'>
          {UI_STRINGS.onboarding.academicSetup.guestNote}
        </Text>
      )}

      {hasError && (
        <Text className='ui-caption' role='alert'>
          {UI_STRINGS.onboarding.saveFailed}
        </Text>
      )}

      <Box className='ui-cluster gap-2'>
        <Button
          className='button subtle w-full min-h-11 sm:w-auto sm:min-h-0'
          disabled={isSaving}
          onClick={skip}
        >
          {UI_STRINGS.onboarding.academicSetup.skip}
        </Button>
        <Button
          className='button solid w-full min-h-11 sm:w-auto sm:min-h-0'
          isLoading={isSaving}
          disabled={isSaving || subjects.length === 0}
          onClick={save}
        >
          {hasProfile
            ? UI_STRINGS.onboarding.academicSetup.saveChanges
            : UI_STRINGS.onboarding.academicSetup.submit}
        </Button>
      </Box>
    </Box>
  )
}
