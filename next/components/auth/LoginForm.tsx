'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { Button } from '@/components/common/Button'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Card } from '@/components/ui/Card'
import { useLoginForm } from '@/hooks/auth/useLoginForm'

export type LoginFormProps = {
  onSwitchToRegister: () => void
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { values, setField, touch, fields, isBusy, canSubmit, handleSubmit } =
    useLoginForm()

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
          label={UI_STRINGS.auth.login.passwordLabel}
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

      <Card.Footer className='ui-stack gap-3 border-0'>
        <Button
          type='submit'
          isLoading={isBusy}
          disabled={!canSubmit}
          className='button solid w-full justify-center'
        >
          {isBusy
            ? UI_STRINGS.auth.login.statuses.submitting
            : UI_STRINGS.auth.login.submitButtonLabel}
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
