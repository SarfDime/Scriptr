'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { useId } from 'react'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/common-utils'
import {
  AVATAR_ACCEPTED_TYPES,
  AVATAR_UPLOAD_ENABLED,
} from '@/lib/profile-avatar'
import type { AvatarFieldProps } from '@/types/components/EditProfile.types'

/**
 * The photo row of the edit-profile dialog: current avatar (initials when
 * there is no photo) plus a file picker. Presentational — the picked file
 * lives in `useEditProfileForm`.
 *
 * TODO(r2-optimization): the picker stays disabled while
 * AVATAR_UPLOAD_ENABLED is false, because the upload route doesn't exist
 * yet. Once it does, this also wants a preview of the picked file.
 */
export function AvatarField({
  name,
  avatarUrl,
  file,
  error,
  disabled,
  onSelect,
}: AvatarFieldProps) {
  const inputId = useId()
  const captionId = useId()
  const isDisabled = disabled || !AVATAR_UPLOAD_ENABLED

  const caption =
    error ??
    file?.name ??
    (AVATAR_UPLOAD_ENABLED ? null : UI_STRINGS.profile.edit.avatarUnavailable)

  return (
    <Box className='ui-cluster items-center gap-4'>
      <Avatar
        name={name}
        picture={
          avatarUrl
            ? {
                src: avatarUrl,
                className: 'h-16 w-16 rounded-full shadow-sm',
              }
            : undefined
        }
        initialsIconProps={{
          className: 'h-16 w-16 rounded-full shadow-sm p-1 text-xl',
        }}
      />
      <Box className='ui-stack gap-1'>
        <Text className='text-base font-semibold'>
          {UI_STRINGS.profile.edit.avatarLabel}
        </Text>
        <input
          id={inputId}
          type='file'
          accept={AVATAR_ACCEPTED_TYPES.join(',')}
          disabled={isDisabled}
          aria-invalid={error !== null}
          aria-describedby={caption ? captionId : undefined}
          className='peer sr-only'
          onChange={(event) => {
            onSelect(event.target.files?.[0] ?? null)
            // Reset so re-picking the same file fires onChange again.
            event.target.value = ''
          }}
        />
        <label
          htmlFor={inputId}
          className={cn(
            'button button-sm hollow w-fit cursor-pointer',
            'peer-focus-visible:outline-2 peer-disabled:pointer-events-none peer-disabled:opacity-50'
          )}
        >
          {UI_STRINGS.profile.edit.avatarChange}
        </label>
        {caption && (
          <Text
            id={captionId}
            className={cn('ui-caption', error && 'text-danger-600')}
          >
            {caption}
          </Text>
        )}
      </Box>
    </Box>
  )
}
