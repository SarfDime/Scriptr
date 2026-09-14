'use client'

import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { ConfirmAction } from '@/components/ui/ConfirmAction'
import { useGuestAcademicData } from '@/hooks/useGuestAcademicData'
import type { OnboardingCatalog } from '@/types/onboarding.types'
import { ProfileAcademicSummary } from './ProfileAcademicSummary'

export const ProfilePageClient = ({
  catalog,
}: {
  catalog: OnboardingCatalog
}) => {
  const { data, clear } = useGuestAcademicData()

  return (
    <Box className='ui-stack gap-4'>
      <Box className='ui-cluster items-center justify-between'>
        {/*  TODO: Maybe set up to launch modal from here possibly */}
        <Button className='button subtle ui-caption px-3 py-1.5'>
          Edit onboarding
        </Button>
        <ConfirmAction
          title='Clear your academic profile?'
          description='This removes your university, faculty, study, and completed subjects from this browser. This cannot be undone.'
          confirmLabel='Clear profile'
          onConfirm={clear}
          trigger={(openConfirm) => (
            <Button
              onClick={openConfirm}
              className='button basic ui-caption px-3 py-1.5 text-rose-pink'
            >
              Clear data
            </Button>
          )}
        />
      </Box>
      <ProfileAcademicSummary catalog={catalog} data={data} />
    </Box>
  )
}
