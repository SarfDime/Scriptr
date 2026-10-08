'use client'

import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { SectionHeader } from '@/components/common/SectionHeader'

type OnboardingAccountPromptProps = {
  onContinueAsGuest: () => void
  onCreateAccount: () => void
}

/** Final step: nudges toward account creation before saving. The completed
 * guest payload is read and sent with the registration request. */
export const OnboardingAccountPrompt = ({
  onContinueAsGuest,
  onCreateAccount,
}: OnboardingAccountPromptProps) => (
  <Box className='ui-stack gap-4'>
    <SectionHeader
      title='Save your progress'
      subtitle='Without an account, this only lives in this browser. Create an account to keep it synced across your devices.'
    />
    <Box className='ui-cluster gap-2 justify-center flex-1'>
      <Button
        onClick={onContinueAsGuest}
        className='button ghost px-4 py-2 grow'
      >
        Continue as guest
      </Button>
      <NextLink
        href='/auth?mode=register'
        onClick={onCreateAccount}
        className='button solid px-4 py-2 grow'
      >
        Create an account
      </NextLink>
    </Box>
  </Box>
)
