'use client'

import { STEP_ORDER } from '@shared/config/api'
import { useState } from 'react'
import type { OnboardingCatalog } from '@/types/onboarding.types'
import { useMicrotaskEffect } from '../useMicrotaskEffect'
import { resolveCascade, useAcademicSelections } from './useAcademicSelections'
import { useGuestAcademicData } from './useGuestAcademicData'

/**
 * Drives the onboarding form: the step state and guest-data hydration live
 * here, while the university/faculty/study cascade and the year/subject
 * completion logic come from `useAcademicSelections` (shared with the
 * profile academics editor), built on top of the guest data store.
 */
export const useOnboardingWizard = (catalog: OnboardingCatalog) => {
  const { data, update, clear } = useGuestAcademicData()
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEP_ORDER[stepIndex]

  const selections = useAcademicSelections(catalog, data, update)

  // Runs once, after guest-data hydration (see useGuestAcademicData) —
  // corrects stale localStorage from an earlier catalog (a faculty/study
  // that no longer exists) and applies the first-visit singleton
  // auto-select, in one pass covering all three levels.
  // useMicrotaskEffect, not useEffect: its own comment explains why (the
  // callback is kept fresh via a ref written in a *separate* effect, so
  // by the time this one's single queued microtask actually runs — after
  // guest-data's own hydration microtask, queued first, has already
  // committed — it sees the post-hydration `data`, not this render's).
  useMicrotaskEffect(() => {
    const resolved = resolveCascade(catalog, {
      universityId: data.universityId,
      facultyId: data.facultyId,
      studyId: data.studyId,
    })
    if (
      resolved.universityId !== data.universityId ||
      resolved.facultyId !== data.facultyId ||
      resolved.studyId !== data.studyId
    ) {
      update(resolved)
    }
  })

  const goNext = () =>
    setStepIndex((current) => Math.min(current + 1, STEP_ORDER.length - 1))
  const goBack = () => setStepIndex((current) => Math.max(current - 1, 0))

  const finish = () =>
    update({
      onboardingCompletedAt: new Date().toISOString(),
      onboardingDismissedAt: null,
    })

  return {
    step,
    stepIndex,
    totalSteps: STEP_ORDER.length,
    goNext,
    goBack,
    data,
    update,
    clear,
    finish,
    ...selections,
  }
}
