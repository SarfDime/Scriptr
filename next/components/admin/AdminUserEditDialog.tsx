'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type {
  AdminProfileListItem,
  UserRole,
} from '@shared/types/profile.types'
import { Button } from '@/components/common/Button'
import { FormContainer } from '@/components/typography/FormContainer'
import { InputWrapper } from '@/components/typography/InputWrapper'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Field } from '@/components/ui/field/Field'
import { Select } from '@/components/ui/select/Select'
import { useAdminUserForm } from '@/hooks/admin/useAdminUserForm'
import type { SelectOptionType } from '@/types/components/Select.types'

const ROLE_OPTIONS: Array<SelectOptionType<UserRole>> = (
  ['student', 'owner'] as const
).map((role) => ({
  id: role,
  value: role,
  label: ADMIN_STRINGS.usersRoleNames[role],
}))

/** Edits the fields an administrator can change on someone else's account:
 * username, full name and role. Selections stay on the profile's own page. */
export const AdminUserEditDialog = ({
  profile,
  onClose,
  onSaved,
}: {
  profile: AdminProfileListItem
  onClose: () => void
  onSaved: () => void
}) => {
  const form = useAdminUserForm({
    profile,
    onSaved: () => {
      onSaved()
      onClose()
    },
  })

  return (
    <Dialog
      title={ADMIN_STRINGS.usersEditTitle}
      hideTrigger
      isOpen
      onClose={onClose}
      dialogProps={{
        className: 'md:w-[min(28rem,calc(100vw-2rem))] md:min-w-0',
      }}
    >
      <FormContainer onSubmit={form.handleSubmit}>
        <Card.Body className='ui-stack gap-4 p-5'>
          <InputWrapper
            label={ADMIN_STRINGS.usersEditUsername}
            labelProps={{ htmlFor: 'admin-user-username' }}
            inputProps={{
              id: 'admin-user-username',
              autoComplete: 'off',
              required: true,
              disabled: form.saving,
            }}
            inputVal={form.values.username}
            inputOnChange={(event) =>
              form.setField('username', event.target.value)
            }
            {...form.fields.username}
          />
          <InputWrapper
            label={ADMIN_STRINGS.usersEditFullName}
            labelProps={{ htmlFor: 'admin-user-full-name' }}
            inputProps={{
              id: 'admin-user-full-name',
              autoComplete: 'off',
              required: true,
              disabled: form.saving,
            }}
            inputVal={form.values.fullName}
            inputOnChange={(event) =>
              form.setField('fullName', event.target.value)
            }
            {...form.fields.fullName}
          />
          <Field label={ADMIN_STRINGS.usersEditRole}>
            <Select<UserRole>
              disabled={form.saving}
              defaultOption={ROLE_OPTIONS.find(
                (option) => option.value === form.values.role
              )}
              options={ROLE_OPTIONS}
              setSelectedValue={form.setRole}
              triggerProps={{ 'aria-label': ADMIN_STRINGS.usersEditRole }}
            />
          </Field>
        </Card.Body>

        <Card.Footer className='ui-cluster justify-end gap-2 border-grey-200 border-t px-5 py-4'>
          <Button
            onClick={onClose}
            disabled={form.saving}
            className='button subtle'
          >
            {ADMIN_STRINGS.cancel}
          </Button>
          <Button
            type='submit'
            isLoading={form.saving}
            disabled={!form.canSubmit}
            className='button solid'
          >
            {ADMIN_STRINGS.save}
          </Button>
        </Card.Footer>
      </FormContainer>
    </Dialog>
  )
}
