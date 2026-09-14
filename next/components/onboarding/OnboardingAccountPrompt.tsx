import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'

type OnboardingAccountPromptProps = { onContinueAsGuest: () => void }

/** Final step: nudges toward account creation before saving, since guest
 * data only lives in this browser until then. */
export const OnboardingAccountPrompt = ({
  onContinueAsGuest,
}: OnboardingAccountPromptProps) => (
  <Box className='ui-stack gap-4'>
    <Box className='ui-stack gap-1'>
      <Text className='ui-title font-semibold'>Save your progress</Text>
      <Text className='ui-caption text-grey-500'>
        Without an account, this only lives in this browser. Create an account
        to keep it synced across your devices.
      </Text>
    </Box>
    <Box className='ui-cluster gap-2'>
      <NextLink href='/sign-up' className='button solid px-4 py-2 ui-body'>
        Create an account
      </NextLink>
      <Button
        onClick={onContinueAsGuest}
        className='button subtle px-4 py-2 ui-body'
      >
        Continue as guest
      </Button>
    </Box>
  </Box>
)
