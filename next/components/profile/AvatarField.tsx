'use client'

import { useId } from 'react'
import { Box } from '@/components/common/Box'
import { Text } from '@/components/typography/Text'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/common-utils'
import { AVATAR_ACCEPT_ATTRIBUTE } from '@/lib/profile-avatar'
import { useUIStrings } from '@/providers/locale/use-strings'
import type { AvatarFieldProps } from '@/types/components/EditProfile.types'

/**
 * The photo row of the edit-profile dialog: current avatar (initials when
 * there is no photo) plus a file picker. Presentational — the picked file
 * lives in `useEditProfileForm`, which also uploads it.
 */
export function AvatarField({
  name,
  avatarUrl,
  file,
  error,
  disabled,
  onSelect,
}: AvatarFieldProps) {
  const ui = useUIStrings()
  const inputId = useId()
  const captionId = useId()

  const caption = error ?? file?.name ?? null

  return (
    <Box className='ui-cluster gap-4'>
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
          className: 'h-16 w-16 rounded-full shadow-sm',
        }}
      />
      <Box className='ui-stack gap-1'>
        <Text className='text-base font-semibold'>
          {ui.profile.edit.avatarLabel}
        </Text>
        <input
          id={inputId}
          type='file'
          accept={AVATAR_ACCEPT_ATTRIBUTE.join(',')}
          disabled={disabled}
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
            'button button-sm subtle w-fit cursor-pointer',
            'peer-focus-visible:outline-2 peer-disabled:pointer-events-none peer-disabled:opacity-50'
          )}
        >
          {ui.profile.edit.avatarChange}
        </label>
        {caption && (
          <Text
            id={captionId}
            className={cn('ui-caption', error && 'cp-danger-nb')}
          >
            {caption}
          </Text>
        )}
      </Box>
    </Box>
  )
}
