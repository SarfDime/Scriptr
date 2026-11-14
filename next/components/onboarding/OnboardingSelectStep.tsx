'use client'

import { Field } from '@/components/ui/field/Field'
import { Select } from '@/components/ui/select/Select'
import { useUIStrings } from '@/providers/locale/use-strings'
import type { OnboardingSelectStepProps } from '@/types/onboarding.types'

/**
 * A single-choice dropdown, reused for university, faculty and study. All
 * three show together, so one that can't be used yet says why
 * (`disabledReason`) in its trigger instead of disappearing. Remounted when
 * the selection changes from outside (e.g. a parent pick clearing it), since
 * `Select` keeps its own copy of the chosen option.
 */
export const OnboardingSelectStep = ({
  title,
  options,
  selectedId,
  onSelect,
  disabledReason,
}: OnboardingSelectStepProps) => {
  const ui = useUIStrings()
  const selectOptions = options.map((option) => ({
    id: option.id,
    value: option.id,
    label: option.name,
  }))
  const placeholder =
    disabledReason ??
    (options.length === 0 ? ui.onboarding.noOptions : undefined)

  return (
    <Field label={title} valid={Boolean(selectedId)}>
      <Select
        key={selectedId ?? 'none'}
        options={selectOptions}
        defaultOption={selectOptions.find(({ id }) => id === selectedId)}
        setSelectedValue={onSelect}
        placeholder={placeholder}
        disabled={Boolean(placeholder)}
        triggerProps={{ 'aria-label': title }}
      />
    </Field>
  )
}
