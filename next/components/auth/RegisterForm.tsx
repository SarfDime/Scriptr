'use client'

import { Button } from '@/components/common/Button'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { useRegisterForm } from '@/hooks/auth/useRegisterForm'
import { useUIStrings } from '@/providers/locale/use-strings'

export type RegisterFormProps = {
  onSwitchToLogin: () => void
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const ui = useUIStrings()
  const {
    values,
    setField,
    touch,
    fields,
    isBusy,
    canSubmit,
    state,
    handleSubmit,
  } = useRegisterForm()

  if (state.status === 'awaiting-confirmation') {
    return (
      <Card.Body className='ui-stack gap-4 text-center'>
        <Button
          onClick={onSwitchToLogin}
          className='button subtle w-full justify-center'
        >
          {ui.auth.register.switchToLogin}
        </Button>
      </Card.Body>
    )
  }

  return (
    <FormContainer onSubmit={handleSubmit}>
      <Card.Body className='ui-stack gap-4'>
        <InputWrapper
          label={ui.auth.register.fullNameLabel}
          inputProps={{
            id: 'register-full-name',
            type: 'text',
            autoComplete: 'name',
            required: true,
            disabled: isBusy,
            'aria-invalid': fields.fullName.invalid,
            onBlur: () => touch('fullName'),
          }}
          labelProps={{ htmlFor: 'register-full-name' }}
          inputVal={values.fullName}
          inputOnChange={(event) => setField('fullName', event.target.value)}
          disabled={isBusy}
          {...fields.fullName}
        />

        <InputWrapper
          label={ui.auth.register.usernameLabel}
          inputProps={{
            id: 'register-username',
            type: 'text',
            autoComplete: 'username',
            required: true,
            disabled: isBusy,
            'aria-invalid': fields.username.invalid,
            onBlur: () => touch('username'),
          }}
          labelProps={{ htmlFor: 'register-username' }}
          inputVal={values.username}
          inputOnChange={(event) => setField('username', event.target.value)}
          disabled={isBusy}
          {...fields.username}
        />

        <InputWrapper
          label={ui.auth.register.emailLabel}
          inputProps={{
            id: 'register-email',
            type: 'email',
            autoComplete: 'email',
            required: true,
            disabled: isBusy,
            'aria-invalid': fields.email.invalid,
            onBlur: () => touch('email'),
          }}
          labelProps={{ htmlFor: 'register-email' }}
          inputVal={values.email}
          inputOnChange={(event) => setField('email', event.target.value)}
          disabled={isBusy}
          {...fields.email}
        />

        <InputWrapper
          label={ui.auth.register.passwordLabel}
          inputProps={{
            id: 'register-password',
            type: 'password',
            autoComplete: 'new-password',
            required: true,
            disabled: isBusy,
            'aria-invalid': fields.password.invalid,
            onBlur: () => touch('password'),
          }}
          labelProps={{ htmlFor: 'register-password' }}
          inputVal={values.password}
          inputOnChange={(event) => setField('password', event.target.value)}
          disabled={isBusy}
          {...fields.password}
        />

        {isBusy && (
          <Text className='ui-caption'>
            {ui.auth.register.statuses.submitting}
          </Text>
        )}
      </Card.Body>

      <Card.Footer className='ui-stack gap-3 border-0 ice-groove-none'>
        <Button
          type='submit'
          disabled={!canSubmit}
          className='button solid w-full justify-center'
        >
          {ui.auth.register.submitButtonLabel}
        </Button>
        <Button
          onClick={onSwitchToLogin}
          disabled={isBusy}
          className='button basic w-full justify-center'
        >
          {ui.auth.register.switchToLogin}
        </Button>
      </Card.Footer>
    </FormContainer>
  )
}
