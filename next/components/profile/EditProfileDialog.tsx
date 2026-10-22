'use client'

import { UI_STRINGS } from '@shared/config/strings'
import type { MyProfileResponse } from '@shared/types/profile.types'
import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { AvatarField } from '@/components/profile/AvatarField'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { useEditProfileForm } from '@/hooks/profile/useEditProfileForm'
import { useDeviceType } from '@/hooks/useDeviceType'
import { getDisplayName } from '@/lib/profile-display'

/** Trigger plus the edit dialog. The dialog (and its form state) is only
 * mounted while open, so every opening starts from the saved values and
 * there is no reset logic to keep in sync. */
export function EditProfileButton({ profile }: { profile: MyProfileResponse }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className='button button-sm subtle'
      >
        {UI_STRINGS.profile.editProfileLabel}
      </Button>
      {isOpen && (
        <EditProfileDialog profile={profile} onClose={() => setIsOpen(false)} />
      )}
    </>
  )
}

/** Edits the username and full name through `PATCH /profiles/me`. Faculty
 * and study selection stay with the onboarding flow for now. The photo
 * picker is wired but disabled until avatar upload exists. */
function EditProfileDialog({
  profile,
  onClose,
}: {
  profile: MyProfileResponse
  onClose: () => void
}) {
  const isMobile = useDeviceType() === 'mobile'
  const {
    values,
    setField,
    touch,
    fields,
    isBusy,
    canSubmit,
    avatarFile,
    avatarError,
    selectAvatar,
    handleSubmit,
  } = useEditProfileForm({ profile, onSaved: onClose })

  return (
    <Dialog
      title={UI_STRINGS.profile.edit.title}
      hideTrigger
      isOpen
      onClose={onClose}
      dialogProps={{
        className:
          'overflow-hidden md:top-0 md:bottom-0 md:my-auto md:max-h-[90vh] md:max-w-md open:flex open:flex-col',
      }}
      closeOnOutsideClick={false}
      closeOnEsc={false}
      hideBackdrop={isMobile}
    >
      <FormContainer
        onSubmit={handleSubmit}
        className='flex min-h-0 flex-1 flex-col'
      >
        <Card.Body className='ui-stack min-h-0 flex-1 gap-5 overflow-y-auto p-5'>
          <AvatarField
            name={getDisplayName(profile)}
            avatarUrl={profile.avatar_url}
            file={avatarFile}
            error={avatarError}
            disabled={isBusy}
            onSelect={selectAvatar}
          />

          <InputWrapper
            label={UI_STRINGS.profile.edit.fullNameLabel}
            inputProps={{
              id: 'edit-profile-full-name',
              type: 'text',
              autoComplete: 'name',
              required: true,
              disabled: isBusy,
              'aria-invalid': fields.fullName.invalid,
              onBlur: () => touch('fullName'),
            }}
            labelProps={{ htmlFor: 'edit-profile-full-name' }}
            inputVal={values.fullName}
            inputOnChange={(event) => setField('fullName', event.target.value)}
            disabled={isBusy}
            {...fields.fullName}
          />

          <InputWrapper
            label={UI_STRINGS.profile.edit.usernameLabel}
            inputProps={{
              id: 'edit-profile-username',
              type: 'text',
              autoComplete: 'username',
              required: true,
              disabled: isBusy,
              'aria-invalid': fields.username.invalid,
              onBlur: () => touch('username'),
            }}
            labelProps={{ htmlFor: 'edit-profile-username' }}
            inputVal={values.username}
            inputOnChange={(event) => setField('username', event.target.value)}
            disabled={isBusy}
            {...fields.username}
          />
        </Card.Body>

        <Card.Footer className='ui-cluster shrink-0 justify-end gap-2 border-grey-200 border-t px-5 py-4'>
          <Button onClick={onClose} disabled={isBusy} className='button subtle'>
            {UI_STRINGS.profile.edit.cancel}
          </Button>
          <Button type='submit' disabled={!canSubmit} className='button solid'>
            {UI_STRINGS.profile.edit.save}
          </Button>
        </Card.Footer>
      </FormContainer>
    </Dialog>
  )
}
