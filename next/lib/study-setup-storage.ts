'use client'

import type { AcademicSelections } from '@/types/onboarding.types'

/**
 * One study's setup as this browser remembers it, keyed by the study's
 * database id. This is the guest's academic profile — no account, no server
 * row — and it also carries the signed-in reader's "skip for now", so the
 * dismissal works the same way for both.
 *
 * Subjects are database ids: they are what `profile_subjects` takes, so a guest
 * record can be applied to an account later without another catalog lookup.
 */
export type StudySetupRecord = {
  subjectIds: Array<string>
  completedYears: Array<number>
  completedAt: string | null
  dismissedAt: string | null
}

const KEY_PREFIX = 'scriptr:study-setup:'

export const EMPTY_STUDY_SETUP: StudySetupRecord = {
  subjectIds: [],
  completedYears: [],
  completedAt: null,
  dismissedAt: null,
}

const listenersByStudy = new Map<string, Set<() => void>>()
const cacheByStudy = new Map<string, StudySetupRecord>()

const storageKey = (studyId: string) => `${KEY_PREFIX}${studyId}`

const notify = (studyId: string) => {
  for (const listener of listenersByStudy.get(studyId) ?? []) listener()
}

/** Safe on the server (returns the empty record) and tolerant of corrupt or
 * missing data, like the onboarding store it replaces for study setup. */
export const readStudySetup = (studyId: string): StudySetupRecord => {
  if (typeof window === 'undefined') return EMPTY_STUDY_SETUP

  const cached = cacheByStudy.get(studyId)
  if (cached) return cached

  let record = EMPTY_STUDY_SETUP
  try {
    const raw = window.localStorage.getItem(storageKey(studyId))
    if (raw) record = { ...EMPTY_STUDY_SETUP, ...JSON.parse(raw) }
  } catch {
    record = EMPTY_STUDY_SETUP
  }

  cacheByStudy.set(studyId, record)
  return record
}

export const writeStudySetup = (
  studyId: string,
  patch: Partial<StudySetupRecord>
) => {
  if (typeof window === 'undefined') return

  const next = { ...readStudySetup(studyId), ...patch }
  cacheByStudy.set(studyId, next)
  try {
    window.localStorage.setItem(storageKey(studyId), JSON.stringify(next))
  } catch {
    // Storage full or unavailable (private browsing) — the page still works,
    // the setup just is not remembered.
  }
  notify(studyId)
}

/** Every study this browser has a record for. The registration hand-off needs
 * the whole set, not one study at a time: each completed record is applied to
 * the new account. */
export const listStudySetups = (): Array<{
  studyId: string
  record: StudySetupRecord
}> => {
  if (typeof window === 'undefined') return []

  const entries: Array<{ studyId: string; record: StudySetupRecord }> = []
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (!key?.startsWith(KEY_PREFIX)) continue
    const studyId = key.slice(KEY_PREFIX.length)
    if (!studyId) continue
    entries.push({ studyId, record: readStudySetup(studyId) })
  }
  return entries
}

/** Forgets every study's record. Called once they have been applied to an
 * account, so a shared browser does not hand them to the next person. */
export const clearStudySetups = () => {
  if (typeof window === 'undefined') return

  for (const { studyId } of listStudySetups()) {
    cacheByStudy.delete(studyId)
    try {
      window.localStorage.removeItem(storageKey(studyId))
    } catch {
      // Storage unavailable — nothing was stored to begin with.
    }
    notify(studyId)
  }
}

export const hasCompletedStudySetup = (studyId: string): boolean =>
  readStudySetup(studyId).completedAt !== null

export const hasDismissedStudySetup = (studyId: string): boolean =>
  readStudySetup(studyId).dismissedAt !== null

/** The pickers' view of the record: Sanity ids, which is what the study's
 * subjects are rendered with (see `AcademicSetupForm`). */
export const toAcademicSelections = (
  record: StudySetupRecord,
  subjects: ReadonlyArray<{ _id: string; dbId?: string | null }>
): Pick<AcademicSelections, 'completedYears' | 'completedSubjectIds'> => {
  const sanityIdByDbId = new Map(
    subjects.flatMap((subject) =>
      subject.dbId ? [[subject.dbId, subject._id] as const] : []
    )
  )

  return {
    completedYears: [...record.completedYears],
    completedSubjectIds: record.subjectIds.flatMap((dbId) => {
      const sanityId = sanityIdByDbId.get(dbId)
      return sanityId ? [sanityId] : []
    }),
  }
}

export const subscribeToStudySetup = (
  studyId: string,
  listener: () => void
): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {
      // Server-rendered snapshots have no browser subscription.
    }
  }

  const listeners = listenersByStudy.get(studyId) ?? new Set()
  listeners.add(listener)
  listenersByStudy.set(studyId, listeners)

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== storageKey(studyId)) return
    cacheByStudy.delete(studyId)
    listener()
  }
  window.addEventListener('storage', handleStorage)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', handleStorage)
  }
}
