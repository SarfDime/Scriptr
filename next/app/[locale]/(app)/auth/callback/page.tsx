'use client'

import { localizedPath } from '@shared/utils/localized-path'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { PageLayout } from '@/components/layout/PageLayout'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { useAuthCallback } from '@/hooks/auth/useAuthCallback'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useUIStrings } from '@/providers/locale/use-strings'

export default function AuthCallbackPage() {
  const { locale } = useLocale()
  const ui = useUIStrings()
  const state = useAuthCallback()

  return (
    <PageLayout className='flex items-center justify-center min-h-[60vh]'>
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
    </PageLayout>
  )
}
