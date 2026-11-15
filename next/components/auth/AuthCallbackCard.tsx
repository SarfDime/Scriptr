'use client'

import { localizedPath } from '@shared/utils/localized-path'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { useAuthCallback } from '@/hooks/auth/useAuthCallback'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useUIStrings } from '@/providers/locale/use-strings'

/**
 * What the OAuth return address shows while it exchanges the token fragment for
 * a session. A Client Component because the fragment (`#access_token=…`, left by
 * Supabase's hosted `/verify`) is only ever in `window.location` — it never
 * reaches the server, so the page around this card stays a Server Component.
 */
export const AuthCallbackCard = () => {
  const { locale } = useLocale()
  const ui = useUIStrings()
  const state = useAuthCallback()

  return (
    <Card className='w-full max-w-md p-6 ui-stack gap-4 text-center'>
      {state.status === 'processing' ? (
        <Text className='ui-body'>{ui.auth.callback.processingLabel}</Text>
      ) : (
        <>
          <Text className='ui-caption cp-danger-nb'>{state.message}</Text>
          <NextLink href={localizedPath('/auth', locale)} className='w-full'>
            <Button className='button solid w-full justify-center'>
              {ui.auth.callback.backToSignIn}
            </Button>
          </NextLink>
        </>
      )}
    </Card>
  )
}
