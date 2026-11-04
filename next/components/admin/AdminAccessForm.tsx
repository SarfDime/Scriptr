'use client'

import { ACCESS_CODE_LENGTH } from '@shared/config/access'
import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import { useRouter } from 'next/navigation'
import { type SubmitEvent, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SectionHeader } from '@/components/common/SectionHeader'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Text } from '@/components/typography/Text'
import { requestAdminAccess } from '@/lib/api/admin-access-api'
import { ApiError } from '@/lib/api/next-api'

const CODE_PATTERN = new RegExp(`^\\d{${ACCESS_CODE_LENGTH}}$`)

const messageFor = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 401) return ADMIN_STRINGS.accessRejected
    if (error.status === 429) return ADMIN_STRINGS.accessRateLimited
  }
  return ADMIN_STRINGS.accessUnavailable
}

/**
 * Unlocks the admin surface. The API answers with an HttpOnly cookie, so this
 * only has to refresh the page for the gated loaders to see it; the code itself
 * is never stored.
 */
export const AdminAccessForm = () => {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'unlocked'>('idle')
  const [error, setError] = useState<string | null>(null)

  const trimmedCode = code.trim()
  const canSubmit = CODE_PATTERN.test(trimmedCode) && status !== 'saving'

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    setStatus('saving')
    setError(null)

    requestAdminAccess(trimmedCode)
      .then(() => {
        setStatus('unlocked')
        setCode('')
        router.refresh()
      })
      .catch((submitError: unknown) => {
        setStatus('idle')
        setError(messageFor(submitError))
      })
  }

  return (
    <Box className='ui-stack gap-4'>
      <SectionHeader title={ADMIN_STRINGS.accessTitle} />
      <Text>{ADMIN_STRINGS.accessHint}</Text>
      <FormContainer onSubmit={handleSubmit} className='ui-stack gap-4'>
        <InputWrapper
          label={ADMIN_STRINGS.accessCodeLabel}
          labelProps={{ htmlFor: 'admin-access-code' }}
          inputProps={{
            id: 'admin-access-code',
            autoComplete: 'one-time-code',
            inputMode: 'numeric',
            maxLength: ACCESS_CODE_LENGTH,
            required: true,
            disabled: status === 'saving',
          }}
          inputVal={code}
          inputOnChange={(event) => setCode(event.target.value)}
        />
        <Button
          type='submit'
          isLoading={status === 'saving'}
          disabled={!canSubmit}
          className='button solid w-fit'
        >
          {ADMIN_STRINGS.accessUnlock}
        </Button>
        {error ? (
          <Text role='alert' className='ui-subtitle'>
            {error}
          </Text>
        ) : null}
        {status === 'unlocked' ? (
          <Text role='status' className='ui-subtitle'>
            {ADMIN_STRINGS.accessUnlocked}
          </Text>
        ) : null}
      </FormContainer>
    </Box>
  )
}
