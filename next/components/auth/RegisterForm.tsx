'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { Button } from '@/components/common/Button'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { useRegisterForm } from '@/hooks/auth/useRegisterForm'

export type RegisterFormProps = {
  onSwitchToLogin: () => void
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const {
    fullName,
    setFullName,
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    isBusy,
    canSubmit,
    state,
    handleSubmit,
  } = useRegisterForm()

  if (state.status === 'awaiting-confirmation') {
    return (
      <Card.Body className='ui-stack gap-4 text-center'>
        <Text className='ui-caption text-success-600'>{state.message}</Text>
        <Button
          onClick={onSwitchToLogin}
          className='button subtle w-full justify-center'
        >
          {UI_STRINGS.auth.register.switchToLogin}
        </Button>
      </Card.Body>
    )
  }

  return (
    <FormContainer onSubmit={handleSubmit}>
      <Card.Body className='ui-stack gap-4'>
        <InputWrapper
          label={UI_STRINGS.auth.register.fullNameLabel}
          inputProps={{
            id: 'register-full-name',
            type: 'text',
            autoComplete: 'name',
            required: true,
            disabled: isBusy,
          }}
          labelProps={{ htmlFor: 'register-full-name' }}
          inputVal={fullName}
          inputOnChange={(event) => setFullName(event.target.value)}
          disabled={isBusy}
        />

        <InputWrapper
          label={UI_STRINGS.auth.register.usernameLabel}
          inputProps={{
            id: 'register-username',
            type: 'text',
            autoComplete: 'username',
            required: true,
            disabled: isBusy,
          }}
          labelProps={{ htmlFor: 'register-username' }}
          inputVal={username}
          inputOnChange={(event) => setUsername(event.target.value)}
          disabled={isBusy}
        />

        <InputWrapper
          label={UI_STRINGS.auth.register.emailLabel}
          inputProps={{
            id: 'register-email',
            type: 'email',
            autoComplete: 'email',
            required: true,
            disabled: isBusy,
          }}
          labelProps={{ htmlFor: 'register-email' }}
          inputVal={email}
          inputOnChange={(event) => setEmail(event.target.value)}
          disabled={isBusy}
        />

        <InputWrapper
          label={UI_STRINGS.auth.register.passwordLabel}
          inputProps={{
            id: 'register-password',
            type: 'password',
            autoComplete: 'new-password',
            required: true,
            disabled: isBusy,
          }}
          labelProps={{ htmlFor: 'register-password' }}
          inputVal={password}
          inputOnChange={(event) => setPassword(event.target.value)}
          disabled={isBusy}
        />

        {isBusy && (
          <Text className='ui-caption'>
            {UI_STRINGS.auth.register.statuses.submitting}
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
          {UI_STRINGS.auth.register.submitButtonLabel}
        </Button>
        <Button
          onClick={onSwitchToLogin}
          disabled={isBusy}
          className='button basic w-full justify-center'
        >
          {UI_STRINGS.auth.register.switchToLogin}
        </Button>
      </Card.Footer>
    </FormContainer>
  )
}
