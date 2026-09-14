import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Radio } from '@/components/ui/radio/RadioButton'

type OnboardingOption = { id: string; name: string }

type OnboardingSelectStepProps = {
  title: string
  description: string
  options: Array<OnboardingOption>
  selectedId: string | null
  onSelect: (id: string) => void
}

/**
 * A single-choice onboarding step, reused for university, faculty, and
 * study selection. When exactly one option exists it renders disabled
 * and pre-selected with a tooltip explaining why, rather than asking the
 * person to confirm a choice they don't actually have.
 */
export const OnboardingSelectStep = ({
  title,
  description,
  options,
  selectedId,
  onSelect,
}: OnboardingSelectStepProps) => {
  const isOnlyOption = options.length === 1

  return (
    <Box className='ui-stack gap-4'>
      <Box className='ui-stack gap-1'>
        <Text className='ui-title font-semibold'>{title}</Text>
        <Text className='ui-caption text-grey-500'>{description}</Text>
      </Box>

      {options.length === 0 ? (
        <Text className='ui-caption text-grey-500'>
          No options available yet.
        </Text>
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
