'use client'

import { EXAM_SESSIONS } from '@shared/config/shared-constants'
import { UI_STRINGS } from '@shared/config/strings'
import type { ExamSession } from '@shared/types/academic.types'
import { capitalize } from '@shared/utils/common-utils'
import { getScriptYears } from '@shared/utils/script-session.utils'
import { useState } from 'react'
import type { SelectOptionType } from '@/types/components/Select.types'

export type ScriptSessionValues = {
  /** `null` is the general (all sessions) option. */
  session: ExamSession | null
  /** `false` until a session is picked, which keeps the year select disabled. */
  isChosen: boolean
  /** `null` is "general (all years)", or no year picked yet. */
  year: number | null
}

/**
 * The session → year pair both script forms edit: picking a session unlocks
 * the years that session has already reached, and changing the session drops a
 * year that may no longer be allowed.
 */
export function useScriptSessionFields(initial: ScriptSessionValues) {
  const [session, setSession] = useState<ExamSession | null>(initial.session)
  const [isChosen, setIsChosen] = useState(initial.isChosen)
  const [year, setYear] = useState<number | null>(initial.year)

  const selectSession = (next: ExamSession | null) => {
    setSession(next)
    setIsChosen(true)
    setYear(null)
  }

  const sessionOptions: Array<SelectOptionType<ExamSession | null>> = [
    {
      id: 'general',
      value: null,
      label: UI_STRINGS.scripts.uploadModal.generalSessionOption,
    },
    ...EXAM_SESSIONS.map((examSession) => ({
      id: examSession,
      value: examSession,
      label: capitalize(examSession),
    })),
  ]

  // Empty until a session is picked — that empty list is what keeps the year
  // select disabled, and "general (all years)" only makes sense once the
  // session itself is general.
  const yearOptions: Array<SelectOptionType<number | null>> = isChosen
    ? [
        ...(session === null
          ? [
              {
                id: 'all-years',
                value: null,
                label: UI_STRINGS.scripts.uploadModal.generalYearOption,
              },
            ]
          : []),
        ...getScriptYears(session).map((availableYear) => ({
          id: String(availableYear),
          value: availableYear,
          label: UI_STRINGS.general.year(availableYear),
        })),
      ]
    : []

  return {
    session,
    isChosen,
    year,
    selectSession,
    setYear,
    sessionOptions,
    yearOptions,
    reset: (next: ScriptSessionValues) => {
      setSession(next.session)
      setIsChosen(next.isChosen)
      setYear(next.year)
    },
  }
}

export type UseScriptSessionFieldsReturn = ReturnType<
  typeof useScriptSessionFields
>
