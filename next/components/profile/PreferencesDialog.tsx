'use client'

import CogIcon from '@sanity/icons/Cog'
import { PREFERENCES_STRINGS } from '@shared/strings/preferences-strings'
import type {
  AchievementNotificationPreference,
  ProfilePreferences,
} from '@shared/types/profile-preferences.types'
import { type SubmitEvent, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { SectionHeader } from '@/components/common/SectionHeader'
import { FormContainer } from '@/components/typography/FormContainer'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/field/Field'
import { Select } from '@/components/ui/select/Select'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'
import { usePreferencesForm } from '@/hooks/profile/usePreferencesForm'
import type { SelectOptionType } from '@/types/components/Select.types'

type ToastPreference = 'on' | 'off'

const TOAST_OPTIONS: Array<SelectOptionType<ToastPreference>> = [
  { id: 'on', value: 'on', label: PREFERENCES_STRINGS.notifications.toastsOn },
  {
    id: 'off',
    value: 'off',
    label: PREFERENCES_STRINGS.notifications.toastsOff,
  },
]

const ACHIEVEMENT_OPTIONS: Array<
  SelectOptionType<AchievementNotificationPreference>
> = [
  {
    id: 'show',
    value: 'show',
    label: PREFERENCES_STRINGS.notifications.achievementsShow,
  },
  {
    id: 'hide',
    value: 'hide',
    label: PREFERENCES_STRINGS.notifications.achievementsHide,
  },
]

/** Gear trigger plus the global preferences modal. The modal only mounts
 * while open, so each opening loads the saved preferences afresh. */
export const PreferencesButton = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        aria-label={PREFERENCES_STRINGS.openLabel}
        title={PREFERENCES_STRINGS.openLabel}
        className='button button-sm subtle'
      >
        <CogIcon />
      </Button>
      {isOpen && <PreferencesDialog onClose={() => setIsOpen(false)} />}
    </>
  )
}

const PreferencesDialog = ({ onClose }: { onClose: () => void }) => {
  const { draft, dirty, loadError, saving, load, updateNotifications, save } =
    usePreferencesForm()

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    save(onClose)
  }

  return (
    <Dialog
      as='section'
      isOpen
      hideTrigger
      title={PREFERENCES_STRINGS.title}
      onClose={onClose}
      placement='center'
      dialogProps={{
        className: 'md:w-[min(28rem,calc(100vw-2rem))] md:min-w-0',
      }}
    >
      <FormContainer onSubmit={handleSubmit}>
        <Card.Body className='ui-stack gap-4 p-4'>
          <Box className='ui-stack ui-above-inside'>
            <SectionHeader
              title={PREFERENCES_STRINGS.notifications.title}
              subtitle={
                PREFERENCES_STRINGS.notifications.moderationAlwaysDelivered
              }
            />
            <PreferencesFields
              draft={draft}
              loadError={loadError}
              onRetry={load}
              onChange={updateNotifications}
            />
          </Box>
        </Card.Body>
        <Card.Footer className='ui-cluster justify-end gap-2 px-4 py-3'>
          <Button onClick={onClose} className='button button-md subtle'>
            {PREFERENCES_STRINGS.cancel}
          </Button>
          <Button
            type='submit'
            isLoading={saving}
            disabled={!dirty}
            className='button button-md solid'
          >
            {PREFERENCES_STRINGS.save}
          </Button>
        </Card.Footer>
      </FormContainer>
    </Dialog>
  )
}

type PreferencesFieldsProps = {
  draft: ProfilePreferences | null
  loadError: boolean
  onRetry: () => void
  onChange: (patch: Partial<ProfilePreferences['notifications']>) => void
}

const PreferencesFields = ({
  draft,
  loadError,
  onRetry,
  onChange,
}: PreferencesFieldsProps) => {
  if (loadError) {
    return (
      <Box role='alert' className='ui-cluster gap-3'>
        <Box as='p' className='ui-subtitle'>
          {PREFERENCES_STRINGS.loadError}
        </Box>
        <Button onClick={onRetry} className='button button-sm subtle'>
          {PREFERENCES_STRINGS.retry}
        </Button>
      </Box>
    )
  }

  if (!draft) return <Skeleton loading aria-busy='true' className='h-24' />

  return (
    <>
      <Field label={PREFERENCES_STRINGS.notifications.toastsLabel}>
        <Select<ToastPreference>
          options={TOAST_OPTIONS}
          defaultOption={
            draft.notifications.toasts ? TOAST_OPTIONS[0] : TOAST_OPTIONS[1]
          }
          setSelectedValue={(value) => onChange({ toasts: value === 'on' })}
          className='ui-above-reverse'
          triggerProps={{
            'aria-label': PREFERENCES_STRINGS.notifications.toastsLabel,
          }}
        />
      </Field>
      <Field label={PREFERENCES_STRINGS.notifications.achievementsLabel}>
        <Select<AchievementNotificationPreference>
          options={ACHIEVEMENT_OPTIONS}
          defaultOption={
            draft.notifications.achievements === 'show'
              ? ACHIEVEMENT_OPTIONS[0]
              : ACHIEVEMENT_OPTIONS[1]
          }
          className='ui-above-reverse'
          setSelectedValue={(achievements) => onChange({ achievements })}
          triggerProps={{
            'aria-label': PREFERENCES_STRINGS.notifications.achievementsLabel,
          }}
        />
      </Field>
    </>
  )
}
