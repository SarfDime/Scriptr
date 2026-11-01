/**
 * Script exam sessions and the years they can be filed under. Lives in
 * `shared/` so the create/edit forms and the Hono `POST /scripts` /
 * `PATCH /scripts/:id` validators apply identical rules.
 *
 * A session happens at a fixed month, so a session that has not come around
 * yet this calendar year has no selectable year of its own: in January 2027 the
 * September session's newest year is 2026.
 */

import {
  EXAM_SESSION_MONTHS,
  EXAM_SESSIONS,
  SCRIPT_START_YEAR,
} from '../config/shared-constants'
import type { ExamSession } from '../types/academic.types'

export const isExamSession = (value: unknown): value is ExamSession =>
  typeof value === 'string' &&
  EXAM_SESSIONS.some((session) => session === value)

/** Newest year a script for `session` can carry. `null` is the general
 * ("all sessions") option, which has no month and so can use the current year.
 */
export const getScriptYearUpperBound = (
  session: ExamSession | null,
  now: Date = new Date()
): number => {
  const currentYear = now.getFullYear()
  if (session === null) return currentYear

  const currentMonth = now.getMonth() + 1
  return currentMonth >= EXAM_SESSION_MONTHS[session]
    ? currentYear
    : currentYear - 1
}

/** Every selectable year for `session`, newest first. */
export const getScriptYears = (
  session: ExamSession | null,
  now: Date = new Date()
): Array<number> => {
  const upperBound = getScriptYearUpperBound(session, now)
  if (upperBound < SCRIPT_START_YEAR) return []

  return Array.from(
    { length: upperBound - SCRIPT_START_YEAR + 1 },
    (_, index) => upperBound - index
  )
}

export const isValidScriptYear = (
  session: ExamSession | null,
  year: number,
  now: Date = new Date()
): boolean =>
  Number.isInteger(year) &&
  year >= SCRIPT_START_YEAR &&
  year <= getScriptYearUpperBound(session, now)
