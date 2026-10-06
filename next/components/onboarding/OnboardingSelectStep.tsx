import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Radio } from '@/components/ui/radio/RadioButton'
import type { OnboardingSelectStepProps } from '@/types/onboarding.types'

/**
 * A single-choice selection block, reused for university, faculty, and
 * study — all rendered together now rather than one at a time, so each
 * one needs to be able to show why it can't be interacted with yet
 * (`disabledReason`) instead of relying on not being on screen at all.
 * When exactly one option exists it renders disabled and pre-selected
 * with a tooltip explaining why, rather than asking the person to
 * confirm a choice they don't actually have.
 */
export const OnboardingSelectStep = ({
  title,
  description,
  options,
  selectedId,
  onSelect,
  disabledReason,
}: OnboardingSelectStepProps) => {
  const isOnlyOption = options.length === 1

  const placeholder =
    disabledReason ??
    (options?.length === 0 ? 'No options available yet.' : null)

  return (
    <Box className='ui-stack gap-4'>
      <Box className='ui-stack gap-1'>
        <Text className='ui-title font-semibold'>{title}</Text>
        <Text className='ui-caption text-grey-500'>{description}</Text>
      </Box>

      {placeholder ? (
        <Text className='ui-caption text-grey-500'>{placeholder}</Text>
      ) : (
        <Box className='ui-stack gap-2'>
          {options.map((option) => (
            <Radio
              key={option.id}
              label={option.name}
              value={option.id}
              checked={selectedId === option.id}
              onChange={() => !isOnlyOption && onSelect(option.id)}
              hasBorder
              disabled={isOnlyOption}
              title={
                isOnlyOption
                  ? `${option.name} is the only available option`
                  : undefined
              }
              aria-label={
                isOnlyOption
                  ? `${option.name} is the only available option, selected automatically`
                  : option.name
              }
            />
          ))}
        </Box>
      )}
    </Box>
  )
}
