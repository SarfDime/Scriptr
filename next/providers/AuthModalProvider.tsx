'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { createContext, type ReactNode, useContext, useState } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Dialog } from '@/components/ui/Dialog'
import { useSession } from '@/providers/SessionProvider'

// Narrower than the dialog default: `md:min-w-0` cancels its minimum width,
// which is wider than a form needs.
const AUTH_DIALOG_CLASS = 'md:w-[min(28rem,calc(100vw-2rem))] md:min-w-0'
// The forms sit on the same inner fill as the script page panels.
const AUTH_PANEL_CLASS = 'rounded-xl border border-grey-200 ui-above-inside p-4'

type AuthMode = 'login' | 'register'

type AuthModalContextValue = {
  /** Opens the login/register modal. Does nothing visible if already signed in. */
  open: (mode?: AuthMode) => void
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null)

/**
 * App-wide sign-in modal. Anything that needs an account — protected actions,
 * the comment composer, saving a script — calls `useAuthModal().open()`
 * instead of showing an error, so the person can log in or register without
 * leaving the page they were on.
 *
 * Must sit inside `SessionProvider`. The modal is visible only while the
 * session isn't authenticated, so it closes by itself the moment a login or
 * registration succeeds (Dialog then reports the close via `onClose`, which
 * resets `isOpen`, so it can't pop back up after a later logout).
 */
export function AuthModalProvider({ children }: { children: ReactNode }) {
  const { session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>('login')

  const open = (initialMode: AuthMode = 'login') => {
    setMode(initialMode)
    setIsOpen(true)
  }

  const isVisible = isOpen && session.status !== 'authenticated'

  return (
    <AuthModalContext.Provider value={{ open }}>
      {children}
      <Dialog
        hideTrigger
        title={
          mode === 'login'
            ? UI_STRINGS.auth.login.title
            : UI_STRINGS.auth.register.title
        }
        dialogProps={{ className: AUTH_DIALOG_CLASS }}
        isOpen={isVisible}
        onClose={() => setIsOpen(false)}
      >
        {/* Mounted only while visible, so the forms start fresh every time. */}
        {isVisible && (
          <Box className='ui-stack gap-4 p-5'>
            <Text className='ui-body text-fg-muted'>
              {UI_STRINGS.auth.subtitle}
            </Text>
            <Box className={AUTH_PANEL_CLASS}>
              {mode === 'login' ? (
                <LoginForm onSwitchToRegister={() => setMode('register')} />
              ) : (
                <RegisterForm onSwitchToLogin={() => setMode('login')} />
              )}
            </Box>
          </Box>
        )}
      </Dialog>
    </AuthModalContext.Provider>
  )
}

export const useAuthModal = () => {
  const context = useContext(AuthModalContext)
  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider')
  }
  return context
}
