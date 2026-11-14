'use client'

import { Button } from '@/components/common/Button'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Card } from '@/components/ui/Card'
import { useLoginForm } from '@/hooks/auth/useLoginForm'
import { useUIStrings } from '@/providers/locale/use-strings'

export type LoginFormProps = {
  onSwitchToRegister: () => void
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const ui = useUIStrings()
  const { values, setField, touch, fields, isBusy, canSubmit, handleSubmit } =
    useLoginForm()

  return (
    <FormContainer onSubmit={handleSubmit}>
      <Card.Body className='ui-stack gap-4'>
        <InputWrapper
          label={ui.auth.login.emailLabel}
          inputProps={{
            id: 'login-email',
            type: 'email',
            autoComplete: 'email',
            required: true,
            disabled: isBusy,
            'aria-invalid': fields.email.invalid,
            onBlur: () => touch('email'),
          }}
          labelProps={{ htmlFor: 'login-email' }}
          inputVal={values.email}
          inputOnChange={(event) => setField('email', event.target.value)}
          disabled={isBusy}
          {...fields.email}
        />

        <InputWrapper
          label={ui.auth.login.passwordLabel}
          inputProps={{
            id: 'login-password',
            type: 'password',
            autoComplete: 'current-password',
            required: true,
            disabled: isBusy,
            'aria-invalid': fields.password.invalid,
            onBlur: () => touch('password'),
          }}
          labelProps={{ htmlFor: 'login-password' }}
          inputVal={values.password}
          inputOnChange={(event) => setField('password', event.target.value)}
          disabled={isBusy}
          {...fields.password}
        />
      </Card.Body>

      <Card.Footer className='ui-stack gap-3 border-0 ice-groove-none'>
        <Button
          type='submit'
          isLoading={isBusy}
          disabled={!canSubmit}
          className='button solid w-full justify-center'
        >
          {isBusy
            ? ui.auth.login.statuses.submitting
            : ui.auth.login.submitButtonLabel}
        </Button>
        <Button
          onClick={onSwitchToRegister}
          disabled={isBusy}
          className='button basic w-full justify-center'
        >
          {ui.auth.login.switchToRegister}
        </Button>
      </Card.Footer>
    </FormContainer>
  )
}
