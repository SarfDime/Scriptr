'use client'

import CogIcon from '@sanity/icons/Cog'
import { PREFERENCES_STRINGS_PACK } from '@shared/strings/preferences-strings'
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
import { DialogFooter } from '@/components/ui/DialogFooter'
import { Field } from '@/components/ui/field/Field'
import { Select } from '@/components/ui/select/Select'
import { Skeleton } from '@/components/ui/skeleton/Skeleton'
import { usePreferencesForm } from '@/hooks/profile/usePreferencesForm'
import { useStrings } from '@/providers/locale/use-strings'
import type { SelectOptionType } from '@/types/components/Select.types'
import { Divider } from '../ui/Divider'
import { CalendarNotesSyncSection } from './CalendarNotesSyncSection'

type ToastPreference = 'on' | 'off'

/** Gear trigger plus the global preferences modal. The modal only mounts
 * while open, so each opening loads the saved preferences afresh. */
export const PreferencesButton = () => {
  const [isOpen, setIsOpen] = useState(false)
  const strings = useStrings(PREFERENCES_STRINGS_PACK)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        aria-label={strings.openLabel}
        title={strings.openLabel}
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
  const strings = useStrings(PREFERENCES_STRINGS_PACK)

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    save(onClose)
  }

  return (
    <Dialog
      as='section'
      isOpen
      hideTrigger
      title={strings.title}
      onClose={onClose}
      placement='center'
      dialogProps={{
        className: 'md:w-[min(28rem,calc(100vw-2rem))] md:min-w-0',
      }}
    >
      <FormContainer onSubmit={handleSubmit}>
        <Card.Body className='ui-stack gap-4 p-4'>
          <Box className='ui-stack'>
            <SectionHeader
              title={strings.notifications.title}
              subtitle={strings.notifications.moderationAlwaysDelivered}
            />
            <PreferencesFields
              draft={draft}
              loadError={loadError}
              onRetry={load}
              onChange={updateNotifications}
            />
          </Box>
          <Divider />
          <CalendarNotesSyncSection />
        </Card.Body>
        <DialogFooter
          secondaryLabel={strings.cancel}
          onSecondary={onClose}
          primaryLabel={strings.save}
          primaryDisabled={!dirty}
          primaryLoading={saving}
        />
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
  const strings = useStrings(PREFERENCES_STRINGS_PACK)
  const { notifications } = strings
  const toastOptions: Array<SelectOptionType<ToastPreference>> = [
    { id: 'on', value: 'on', label: notifications.toastsOn },
    { id: 'off', value: 'off', label: notifications.toastsOff },
  ]
  const achievementOptions: Array<
    SelectOptionType<AchievementNotificationPreference>
  > = [
    { id: 'show', value: 'show', label: notifications.achievementsShow },
    { id: 'hide', value: 'hide', label: notifications.achievementsHide },
  ]

  if (loadError) {
    return (
      <Box role='alert' className='ui-cluster gap-3'>
        <Box as='p' className='ui-subtitle'>
          {strings.loadError}
        </Box>
        <Button onClick={onRetry} className='button button-sm subtle'>
          {strings.retry}
        </Button>
      </Box>
    )
  }

  if (!draft) return <Skeleton loading aria-busy='true' className='h-24' />

  return (
    <>
      <Field label={notifications.toastsLabel}>
        <Select<ToastPreference>
          options={toastOptions}
          defaultOption={
            draft.notifications.toasts ? toastOptions[0] : toastOptions[1]
          }
          setSelectedValue={(value) => onChange({ toasts: value === 'on' })}
          className='ui-above-reverse'
          triggerProps={{
            'aria-label': notifications.toastsLabel,
          }}
        />
      </Field>
      <Field label={notifications.achievementsLabel}>
        <Select<AchievementNotificationPreference>
          options={achievementOptions}
          defaultOption={
            draft.notifications.achievements === 'show'
              ? achievementOptions[0]
              : achievementOptions[1]
          }
          className='ui-above-reverse'
          setSelectedValue={(achievements) => onChange({ achievements })}
          triggerProps={{
            'aria-label': notifications.achievementsLabel,
          }}
        />
      </Field>
    </>
  )
}
