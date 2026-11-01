'use client'

import Calendar from '@sanity/icons/Calendar'
import DocumentPdf from '@sanity/icons/DocumentPdf'
import { UI_STRINGS } from '@shared/config/strings'
import type { ExamSession } from '@shared/types/academic.types'
import { Field } from '@/components/ui/field/Field'
import { Select } from '@/components/ui/select/Select'
import type { UseScriptSessionFieldsReturn } from '@/hooks/useScriptSessionFields'
import { SCRIPT_FIELD_LABEL_PROPS } from './script-form-layout'

export type ScriptSessionYearFieldsProps = {
  fields: UseScriptSessionFieldsReturn
  /** Changes when the form is cleared, remounting the uncontrolled pickers. */
  resetKey: string | number
  disabled: boolean
  /** The create form requires an explicit session; an edit keeps what is saved. */
  required?: boolean
}

/**
 * The session + year pair, with the dependency spelled out in the UI: the year
 * picker stays disabled until a session exists, and its options come from the
 * session the hook resolves.
 */
export function ScriptSessionYearFields({
  fields,
  resetKey,
  disabled,
  required = false,
}: ScriptSessionYearFieldsProps) {
  const {
    session,
    isChosen,
    year,
    selectSession,
    setYear,
    sessionOptions,
    yearOptions,
  } = fields

  const choiceKey = isChosen ? (session ?? 'general') : 'none'

  return (
    <>
      <Field
        className='min-w-0'
        label={UI_STRINGS.scripts.uploadModal.examSessionLabel}
        labelProps={SCRIPT_FIELD_LABEL_PROPS}
        helperText={UI_STRINGS.scripts.uploadModal.examSessionHelp}
        required={required}
        valid={isChosen}
      >
        <Select<ExamSession | null>
          key={`exam-session-${resetKey}-${choiceKey}`}
          className='w-full bg-background-200'
          defaultOption={sessionOptions.find(
            (option) => option.value === session && isChosen
          )}
          placeholder={UI_STRINGS.scripts.uploadModal.examSessionPlaceholder}
          options={sessionOptions}
          setSelectedValue={selectSession}
          triggerProps={{
            'aria-label': UI_STRINGS.scripts.uploadModal.examSessionLabel,
            disabled,
          }}
          icon={<DocumentPdf />}
        />
      </Field>

      <Field
        className='min-w-0'
        label={UI_STRINGS.scripts.uploadModal.examYearLabel}
        labelProps={SCRIPT_FIELD_LABEL_PROPS}
        helperText={UI_STRINGS.scripts.uploadModal.examYearHelp}
      >
        <Select<number | null>
          key={`exam-year-${resetKey}-${choiceKey}-${year ?? 'all'}`}
          className='w-full bg-background-200'
          defaultOption={yearOptions.find((option) => option.value === year)}
          placeholder={UI_STRINGS.scripts.uploadModal.examYearPlaceholder}
          disabled={!isChosen || disabled}
          options={yearOptions}
          setSelectedValue={setYear}
          triggerProps={{
            'aria-label': UI_STRINGS.scripts.uploadModal.examYearLabel,
          }}
          icon={<Calendar />}
        />
      </Field>
    </>
  )
}
