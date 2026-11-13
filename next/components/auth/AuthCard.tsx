'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { Title } from '@/components/typography/Title'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/common-utils'
import { useSession } from '@/providers/SessionProvider'
import { Box } from '../common/Box'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

// Below `md` the card fills the screen under the header: no frame, rounding
// or shadow. From `md` up it is the usual framed card.
const AUTH_CARD_CLASS = cn(
  'w-full max-w-md p-6 ui-stack gap-4 ui-above',
  'max-md:max-w-none max-md:flex-1 max-md:rounded-none max-md:border-0 max-md:shadow-none'
)

/**
 * The whole card is a Client Component rather than just the forms: its
 * title and body both branch on session status (loading/authenticated/
 * anonymous) and on login-vs-register mode, so hoisting only the leaf
 * inputs to 'use client' wouldn't avoid much — the container itself
 * needs the interactivity.
 */
export function AuthCard() {
  const { session, logout } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  )

  // Signing in or out on this page is the end of the flow, so it lands on the
  // homepage instead of leaving a signed-in/out card behind. The first resolved
  // status is the page load itself — someone arriving already signed in keeps
  // the choice of continuing or signing out.
  const previousStatusRef = useRef(session.status)
  useEffect(() => {
    const previous = previousStatusRef.current
    previousStatusRef.current = session.status
    if (previous === 'loading' || previous === session.status) return
    router.replace('/')
  }, [session.status, router])

  if (session.status === 'loading') {
    return (
      <Card className={AUTH_CARD_CLASS}>
        <Text className='ui-body text-center'>
          {UI_STRINGS.auth.loadingLabel}
        </Text>
      </Card>
    )
  }

  if (session.status === 'authenticated') {
    const displayName = session.user.username || session.user.email || ''

    return (
      <Box className={AUTH_CARD_CLASS}>
        <Card.Header>
          <Title as='h1' className='ui-title text-center'>
            {UI_STRINGS.auth.signedInTitle}
          </Title>
        </Card.Header>
        <Card.Body className='ui-stack gap-4 text-center'>
          <Text className='ui-body text-fg-muted'>
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
      </Box>
    )
  }

  return (
    <Box className={AUTH_CARD_CLASS}>
      <Card.Header>
        <Title as='h1' className='ui-title text-center'>
          {mode === 'login'
            ? UI_STRINGS.auth.login.title
            : UI_STRINGS.auth.register.title}
        </Title>
        <Text className='ui-body text-fg-muted text-center'>
          {UI_STRINGS.auth.subtitle}
        </Text>
      </Card.Header>

      {mode === 'login' ? (
        <LoginForm onSwitchToRegister={() => setMode('register')} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setMode('login')} />
      )}

      <Card.Footer className='ui-stack gap-2 border-0 ice-groove-none'>
        <NextLink href='/' className='button basic w-full justify-center'>
          {UI_STRINGS.auth.continueAsGuestLabel}
        </NextLink>
      </Card.Footer>
    </Box>
  )
}
