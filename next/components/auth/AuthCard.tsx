'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Card } from '@/components/ui/Card'
import { useSession } from '@/providers/SessionProvider'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

/**
 * The whole card is a Client Component rather than just the forms: its
 * title and body both branch on session status (loading/authenticated/
 * anonymous) and on login-vs-register mode, so hoisting only the leaf
 * inputs to 'use client' wouldn't avoid much — the container itself
 * needs the interactivity.
 */
export function AuthCard() {
  const { session, logout } = useSession()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  )

  if (session.status === 'loading') {
    return (
      <Card className='w-full max-w-md p-6 ui-stack gap-4 ui-above'>
        <Text className='ui-body text-center'>
          {UI_STRINGS.auth.loadingLabel}
        </Text>
      </Card>
    )
  }

  if (session.status === 'authenticated') {
    const displayName = session.user.username || session.user.email || ''

    return (
      <Card className='w-full max-w-md p-6 ui-stack gap-4 ui-above'>
        <Card.Header>
          <Title as='h1' className='ui-title font-bold text-center'>
            {UI_STRINGS.auth.signedInTitle}
          </Title>
        </Card.Header>
        <Card.Body className='ui-stack gap-4 text-center'>
          <Text className='ui-body text-grey-500'>
            {UI_STRINGS.auth.signedInLabel} {displayName}
          </Text>
          <NextLink href='/' className='w-full'>
            <Button className='button solid w-full justify-center'>
              {UI_STRINGS.auth.continueLabel}
            </Button>
          </NextLink>
          <Button
            onClick={logout}
            className='button subtle w-full justify-center'
          >
            {UI_STRINGS.auth.logoutButtonLabel}
          </Button>
        </Card.Body>
      </Card>
    )
  }

  return (
    <Card className='w-full max-w-md p-6 ui-stack gap-4 ui-above'>
      <Card.Header>
        <Title as='h1' className='ui-title font-bold text-center'>
          {mode === 'login'
            ? UI_STRINGS.auth.login.title
            : UI_STRINGS.auth.register.title}
        </Title>
        <Text className='ui-body text-grey-500 text-center'>
          {UI_STRINGS.auth.subtitle}
        </Text>
      </Card.Header>

      {mode === 'login' ? (
        <LoginForm onSwitchToRegister={() => setMode('register')} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setMode('login')} />
      )}

      <Card.Footer className='ui-stack gap-2'>
        <NextLink href='/' className='button basic w-full justify-center'>
          {UI_STRINGS.auth.continueAsGuestLabel}
        </NextLink>
      </Card.Footer>
    </Card>
  )
}
