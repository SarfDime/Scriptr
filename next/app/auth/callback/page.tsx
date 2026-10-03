'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { PageLayout } from '@/components/layout/PageLayout'
import { Text } from '@/components/typography/Text'
import { Card } from '@/components/ui/Card'
import { useAuthCallback } from '@/hooks/auth/useAuthCallback'

export default function AuthCallbackPage() {
  const state = useAuthCallback()

  return (
    <PageLayout className='flex items-center justify-center min-h-[60vh]'>
      <Card className='w-full max-w-md p-6 ui-stack gap-4 text-center'>
        {state.status === 'processing' ? (
          <Text className='ui-body'>
            {UI_STRINGS.auth.callback.processingLabel}
          </Text>
        ) : (
          <>
            <Text className='ui-caption text-danger-600'>{state.message}</Text>
            <NextLink href='/auth' className='w-full'>
              <Button className='button solid w-full justify-center'>
                {UI_STRINGS.auth.callback.backToSignIn}
              </Button>
            </NextLink>
          </>
        )}
      </Card>
    </PageLayout>
  )
}
