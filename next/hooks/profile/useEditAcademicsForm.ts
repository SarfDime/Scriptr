'use client'

import { UI_STRINGS } from '@shared/config/strings'
import type { MyProfileResponse } from '@shared/types/profile.types'
import { useRouter } from 'next/navigation'
import { type SubmitEvent, useState } from 'react'
import { useAcademicSelections } from '@/hooks/onboarding/useAcademicSelections'
import {
  removeProfileSubject,
  setProfileSubjectStatus,
  updateMyProfile,
} from '@/lib/api/profile-api'
import {
  buildAcademicSelections,
  planAcademicSave,
} from '@/lib/profile-academics'
import { useOnboarding } from '@/providers/onboarding/OnboardingProvider'
import { useMyProfileActions } from '@/providers/ProfileProvider'
import { useSession } from '@/providers/SessionProvider'
import { useToast } from '@/providers/toaster/ToasterProvider'
import type { AcademicSelections } from '@/types/onboarding.types'

/**
 * State and submit flow for the edit-academics dialog. The selection
 * cascade and year/subject logic are the onboarding wizard's
 * (`useAcademicSelections`), run over local state seeded from the account
 * instead of guest storage.
 *
 * Saving diffs the choice against the profile (`planAcademicSave`): the
 * faculty/study replacement goes through `PATCH /profiles/me` (the username
 * is required there, so the current one is sent back unchanged), then the
 * subject statuses through the per-subject routes. Neither is
 * restriction-checked, so this doesn't use useProtectedAction. After a
 * failure the profile is re-read, so a retry diffs against what the server
 * actually holds rather than re-sending what already went through.
 */
export function useEditAcademicsForm({
  profile,
  onSaved,
}: {
  profile: MyProfileResponse
  onSaved: () => void
}) {
  const { catalog } = useOnboarding()
  const router = useRouter()
  const { reload } = useMyProfileActions()
  const { refresh: refreshSession } = useSession()
  const { addToast } = useToast()

  const [data, setData] = useState(() =>
    buildAcademicSelections(catalog, profile)
  )
  const [isBusy, setIsBusy] = useState(false)

  const update = (patch: Partial<AcademicSelections>) =>
    setData((current) => ({ ...current, ...patch }))
  const selections = useAcademicSelections(catalog, data, update)

  // Derived rather than stored: the stored flags would still describe the
  // previous study after switching to another one.
  const completedYears = [...selections.catalog.subjectsByYear.entries()]
    .filter(
      ([, subjects]) =>
        subjects.length > 0 &&
        subjects.every((subject) =>
          data.completedSubjectIds.includes(subject._id)
        )
    )
    .map(([year]) => year)

  const isSelectionComplete = Boolean(
    data.universityId && data.facultyId && data.studyId
  )
  const plan = isSelectionComplete
    ? planAcademicSave(catalog, data, profile)
    : null
  const hasChanges =
    plan !== null &&
    (plan.selectionsChanged ||
      plan.subjectsToComplete.length > 0 ||
      plan.subjectsToRemove.length > 0)
  const canSubmit = !isBusy && hasChanges
  const prepareError =
    isSelectionComplete && plan === null
      ? UI_STRINGS.profile.academics.notPrepared
      : null

  // The session carries the selected studies and subjects too (home feed,
  // profile subjects sidebar), so it is re-read along with the profile.
  const refreshViews = () => Promise.all([reload(), refreshSession()])

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!plan || !canSubmit) return

    setIsBusy(true)
    try {
      if (plan.selectionsChanged) {
        await updateMyProfile({
          username: profile.username ?? '',
          selected_faculty_ids: [plan.facultyDbId],
          selected_study_ids: [plan.studyDbId],
        })
      }
      await Promise.all([
        ...plan.subjectsToComplete.map((id) =>
          setProfileSubjectStatus(id, 'completed')
        ),
        ...plan.subjectsToRemove.map(removeProfileSubject),
      ])
    } catch (error) {
      addToast({
        title: UI_STRINGS.profile.academics.saveFailed,
        description:
          error instanceof Error
            ? error.message
            : UI_STRINGS.profile.academics.saveFailed,
        type: 'error',
      })
      await refreshViews()
      setIsBusy(false)
      return
    }

    await refreshViews()
    // Server-rendered parts of the page (the subjects sidebar) read the
    // session on the server.
    router.refresh()
    addToast({ title: UI_STRINGS.profile.academics.saved, type: 'success' })
    onSaved()
  }

  return {
    data,
    selections,
    completedYears,
    isBusy,
    canSubmit,
    prepareError,
    handleSubmit,
  }
}
