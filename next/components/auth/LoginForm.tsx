'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { Button } from '@/components/common/Button'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { useLoginForm } from '@/hooks/auth/useLoginForm'

export type LoginFormProps = {
  onSwitchToRegister: () => void
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    isBusy,
    canSubmit,
    state,
    handleSubmit,
  } = useLoginForm()

  return (
    <FormContainer onSubmit={handleSubmit}>
      <Card.Body className='ui-stack gap-4'>
        <InputWrapper
          label={UI_STRINGS.auth.login.emailLabel}
          inputProps={{
            id: 'login-email',
            type: 'email',
            autoComplete: 'email',
            required: true,
            disabled: isBusy,
          }}
          labelProps={{ htmlFor: 'login-email' }}
          inputVal={email}
          inputOnChange={(event) => setEmail(event.target.value)}
          disabled={isBusy}
        />

        <InputWrapper
          label={UI_STRINGS.auth.login.passwordLabel}
          inputProps={{
            id: 'login-password',
            type: 'password',
            autoComplete: 'current-password',
            required: true,
            disabled: isBusy,
          }}
          labelProps={{ htmlFor: 'login-password' }}
          inputVal={password}
          inputOnChange={(event) => setPassword(event.target.value)}
          disabled={isBusy}
        />

        {isBusy && (
          <Text className='ui-caption'>
            {UI_STRINGS.auth.login.statuses.submitting}
          </Text>
        )}

        {state.status === 'error' && (
          <Text className='ui-caption text-danger-600'>{state.message}</Text>
        )}
      </Card.Body>

      <Card.Footer className='ui-stack gap-3'>
        <Button
          type='submit'
          disabled={!canSubmit}
          className='button solid w-full justify-center'
        >
          {UI_STRINGS.auth.login.submitButtonLabel}
        </Button>
        <Button
          onClick={onSwitchToRegister}
          disabled={isBusy}
          className='button basic w-full justify-center'
        >
          {UI_STRINGS.auth.login.switchToRegister}
        </Button>
      </Card.Footer>
    </FormContainer>
  )
}
