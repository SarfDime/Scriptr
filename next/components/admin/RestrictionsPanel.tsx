'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type {
  LiftedRestrictionItem,
  RestrictionListItem,
  RestrictionLookupResponse,
} from '@shared/types/restrictions.types'
import { type SubmitEvent, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SectionHeader } from '@/components/common/SectionHeader'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Text } from '@/components/typography/Text'
import { useAdminErrorToast } from '@/hooks/admin/useAdminErrorToast'
import { useAdminList } from '@/hooks/admin/useAdminList'
import {
  getLiftedRestrictions,
  getRestrictions,
  liftRestriction,
  lookupRestriction,
} from '@/lib/api/restrictions-api'
import type { AdminRestrictionsViewModel } from '@/types/components/Admin.types'
import { AdminListStatus } from './AdminListStatus'
import { RestrictionDialog } from './RestrictionDialog'
import { RestrictionItem } from './RestrictionItem'

const RESTRICTION_GROUPS = [
  { key: 'active', title: ADMIN_STRINGS.activeRestrictionsTitle },
  { key: 'lapsed', title: ADMIN_STRINGS.lapsedRestrictionsTitle },
  { key: 'lifted', title: ADMIN_STRINGS.liftedRestrictionsTitle },
] as const

export const RestrictionsPanel = ({
  initialData,
}: {
  initialData: AdminRestrictionsViewModel | null
}) => {
  const {
    items: restrictions,
    loading,
    loadError,
    load,
  } = useAdminList<RestrictionListItem>(initialData?.restrictions ?? null)
  const { items: liftedRestrictions, load: loadLifted } =
    useAdminList<LiftedRestrictionItem>(initialData?.lifted ?? null)
  const [username, setUsername] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupFailed, setLookupFailed] = useState(false)
  const [lookup, setLookup] = useState<RestrictionLookupResponse | null>(null)
  const [liftingId, setLiftingId] = useState<string | null>(null)
  const reportError = useAdminErrorToast()

  const refresh = () => {
    loadLifted(getLiftedRestrictions)
    return load(getRestrictions)
  }

  const handleLookup = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = username.trim()
    if (!name) return

    setLookupLoading(true)
    setLookupFailed(false)
    lookupRestriction({ username: name })
      .then(setLookup)
      .catch(() => setLookupFailed(true))
      .finally(() => setLookupLoading(false))
  }

  const lift = (profileId: string) => {
    setLiftingId(profileId)
    liftRestriction(profileId)
      .then(refresh)
      .catch((error: unknown) => reportError(undefined, error))
      .finally(() => setLiftingId(null))
  }

  return (
    <>
      <Box className='ui-stack ui-above'>
        <SectionHeader title={ADMIN_STRINGS.profileLookup} />
        <FormContainer
          onSubmit={handleLookup}
          className='ui-cluster items-end gap-2'
        >
          <InputWrapper
            className='min-w-48 grow'
            label={ADMIN_STRINGS.username}
            labelProps={{ htmlFor: 'restriction-lookup-username' }}
            inputProps={{
              id: 'restriction-lookup-username',
              autoComplete: 'off',
              required: true,
              disabled: lookupLoading,
            }}
            inputVal={username}
            inputOnChange={(event) => {
              setUsername(event.target.value.toLowerCase())
              setLookupFailed(false)
            }}
            invalid={lookupFailed}
          />
          <Button
            type='submit'
            isLoading={lookupLoading}
            className='button solid'
          >
            {ADMIN_STRINGS.restrictUser}
          </Button>
        </FormContainer>
        {lookupFailed && (
          <Text role='alert' className='text-error-red ui-caption'>
            {ADMIN_STRINGS.lookupError}
          </Text>
        )}
      </Box>

      <AdminListStatus
        loading={loading}
        loadError={loadError}
        errorText={ADMIN_STRINGS.loadRestrictionsError}
        onRetry={refresh}
        isEmpty={restrictions.length === 0 && liftedRestrictions.length === 0}
        emptyText={ADMIN_STRINGS.emptyRestrictions}
      >
        {RESTRICTION_GROUPS.map(({ key, title }) => {
          const group = restrictions.filter(
            (restriction) => restriction.active === (key === 'active')
          )
          const count =
            key === 'lifted' ? liftedRestrictions.length : group.length
          if (count === 0) return null
          return (
            <Box as='section' key={key} className='ui-stack gap-3'>
              <SectionHeader title={title} count={count} />
              <Box className='ui-card-grid-fill [--grid-min:20rem]'>
                {key === 'lifted'
                  ? liftedRestrictions.map((item) => (
                      <RestrictionItem
                        key={item.id}
                        restriction={item}
                        lifting={false}
                      />
                    ))
                  : group.map((restriction) => (
                      <RestrictionItem
                        key={restriction.profile_id}
                        restriction={restriction}
                        lifting={liftingId === restriction.profile_id}
                        onLift={() => lift(restriction.profile_id)}
                      />
                    ))}
              </Box>
            </Box>
          )
        })}
      </AdminListStatus>

      {lookup && (
        <RestrictionDialog
          key={lookup.profile.id}
          lookup={lookup}
          onClose={() => setLookup(null)}
          onApplied={refresh}
        />
      )}
    </>
  )
}
