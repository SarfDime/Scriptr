'use client'

import { STEP_ORDER } from '@shared/config/api'
import { useEffect, useState } from 'react'
import type { OnboardingCatalog } from '@/types/onboarding.types'
import { useGuestAcademicData } from './useGuestAcademicData'
import { useMicrotaskEffect } from './useMicrotaskEffect'

/**
 * Drives the onboarding wizard: computes each step's filtered option list
 * from the prior selection, auto-selects whenever a level has exactly one
 * option, and provides one-click whole-year completion as well as
 * individual-subject completion, built on top of the guest data store.
 */
export const useOnboardingWizard = (catalog: OnboardingCatalog) => {
  const { data, update, clear } = useGuestAcademicData()
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEP_ORDER[stepIndex]

  const faculties = catalog?.faculties?.filter(
    (f) => f?.universityId === data?.universityId
  )
  const studies = catalog?.studies?.filter(
    (s) => s?.facultyId === data?.facultyId
  )

  const selectedStudy = catalog?.studies?.find((s) => s._id === data.studyId)
  const subjectsByYear = selectedStudy?.subjectsByYear ?? []
  const subjects = subjectsByYear.flatMap((group) => group.subjects)

  // Adapter only — grouping itself now happens in the GROQ query, not here.
  const subjectsByYearMap = new Map(
    subjectsByYear.map((group) => [group.year, group.subjects])
  )

  // University auto-select races the guest-data hydration microtask on first
  // mount (both fire in the same commit) — using useMicrotaskEffect here,
  // rather than a plain useEffect, guarantees this runs after hydration's own
  // microtask (queued first, since useGuestAcademicData() is called earlier
  // in this hook), so it can't be wiped by hydration's state replace.
  useMicrotaskEffect(() => {
    if (catalog.universities.length === 1 && !data.universityId) {
      update({ universityId: catalog?.universities?.[0]?._id })
    }
  })

  // Faculty/study auto-select stay as plain effects — they only fire once
  // the user (or the effect above) has already set a parent id, which is
  // always well after hydration has settled, so there's no race here.
  useEffect(() => {
    if (faculties.length === 1 && data.facultyId !== faculties?.[0]?._id) {
      update({ facultyId: faculties?.[0]?._id })
    }
  }, [faculties, data.facultyId, update])

  useEffect(() => {
    if (studies.length === 1 && data.studyId !== studies?.[0]?._id) {
      update({ studyId: studies?.[0]?._id })
    }
  }, [studies, data.studyId, update])

  const goNext = () =>
    setStepIndex((current) => Math.min(current + 1, STEP_ORDER.length - 1))
  const goBack = () => setStepIndex((current) => Math.max(current - 1, 0))

  const completeYear = (year: number) => {
    const yearSubjectIds = (subjectsByYearMap.get(year) ?? []).map((s) => s._id)
    update({
      completedYears: Array.from(new Set([...data.completedYears, year])),
      completedSubjectIds: Array.from(
        new Set([...data.completedSubjectIds, ...yearSubjectIds])
      ),
    })
  }

  const uncompleteYear = (year: number) => {
    const yearSubjectIds = new Set(
      (subjectsByYearMap.get(year) ?? []).map((s) => s._id)
    )
    update({
      completedYears: data.completedYears.filter((y) => y !== year),
      completedSubjectIds: data.completedSubjectIds.filter(
        (id) => !yearSubjectIds.has(id)
      ),
    })
  }

  // Completing every subject in a year individually also marks the year
  // complete. Uncompleting any one subject clears the year-complete flag
  // for the year it belongs to. Keeps `completedYears` and
  // `completedSubjectIds` consistent regardless of which path is used.
  const completeSubject = (subjectId: string) => {
    if (data.completedSubjectIds.includes(subjectId)) return

    const subject = subjects.find((s) => s._id === subjectId)
    if (!subject) return

    const nextCompletedSubjectIds = [...data.completedSubjectIds, subjectId]
    const yearSubjectIds = (subjectsByYearMap.get(subject.year) ?? []).map(
      (s) => s._id
    )
    const isYearNowComplete = yearSubjectIds.every((id) =>
      nextCompletedSubjectIds.includes(id)
    )

    update({
      completedSubjectIds: nextCompletedSubjectIds,
      completedYears: isYearNowComplete
        ? Array.from(new Set([...data.completedYears, subject.year]))
        : data.completedYears,
    })
  }

  const uncompleteSubject = (subjectId: string) => {
    const subject = subjects.find((s) => s._id === subjectId)

    update({
      completedSubjectIds: data.completedSubjectIds.filter(
        (id) => id !== subjectId
      ),
      completedYears: subject
        ? data.completedYears.filter((y) => y !== subject.year)
        : data.completedYears,
    })
  }

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
    completeYear,
    uncompleteYear,
    completeSubject,
    uncompleteSubject,
    catalog: {
      faculties,
      studies,
      subjects,
      subjectsByYear: subjectsByYearMap,
    },
  }
}
