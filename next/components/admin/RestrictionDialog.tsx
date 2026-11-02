'use client'

import { ADMIN_STRINGS } from '@shared/strings/admin-strings'
import type { RestrictionLookupResponse } from '@shared/types/restrictions.types'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { FormContainer } from '@/components/typography/FormContainer'
import { Text } from '@/components/typography/Text'
import { TextArea } from '@/components/typography/TextArea'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { useRestrictionForm } from '@/hooks/admin/useRestrictionForm'

/** Restricts a user, or, when they are already restricted, edits only the
 * reason. The duration is computed by the server; the dialog just shows it. */
export const RestrictionDialog = ({
  lookup,
  onClose,
  onApplied,
}: {
  lookup: RestrictionLookupResponse
  onClose: () => void
  onApplied: () => void
}) => {
  const isActive = lookup.active_restriction !== null
  const form = useRestrictionForm({
    lookup,
    onApplied: () => {
      onApplied()
      onClose()
    },
  })

  return (
    <Dialog
      title={
        isActive
          ? ADMIN_STRINGS.updateRestrictionReason
          : ADMIN_STRINGS.restrictUser
      }
      hideTrigger
      isOpen
      onClose={onClose}
      dialogProps={{
        className: 'md:w-[min(28rem,calc(100vw-2rem))] md:min-w-0',
      }}
    >
      <FormContainer onSubmit={form.handleSubmit}>
        <Card.Body className='ui-stack gap-4 p-5'>
          <Box className='ui-stack gap-2'>
            <Text className='ui-body-strong'>
              <NextLink href={`/user/${lookup.profile.username}`}>
                {lookup.profile.full_name ?? lookup.profile.username}
              </NextLink>
            </Text>
            <Text className='ui-caption'>@{lookup.profile.username}</Text>
            {isActive ? (
              <>
                <Badge colorPalette='cp-warning' className='w-fit'>
                  {ADMIN_STRINGS.currentRestriction}
                </Badge>
                <Text className='ui-caption'>
                  {ADMIN_STRINGS.activeRestrictionReasonOnly}
                </Text>
              </>
            ) : (
              <Badge colorPalette='cp-warning' className='w-fit'>
                {ADMIN_STRINGS.restrictionReasonLabel(lookup.prior_count)}
              </Badge>
            )}
          </Box>

          <TextArea
            value={form.reason}
            inputOnChange={(event) => form.setReason(event.target.value)}
            onBlur={form.touch}
            rows={4}
            maxLength={form.maxLength}
            disabled={form.saving}
            fieldProps={{
              label: ADMIN_STRINGS.restrictionReason,
              ...form.field,
            }}
          />
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
            {isActive
              ? ADMIN_STRINGS.updateRestrictionReason
              : ADMIN_STRINGS.applyRestriction}
          </Button>
        </Card.Footer>
      </FormContainer>
    </Dialog>
  )
}
