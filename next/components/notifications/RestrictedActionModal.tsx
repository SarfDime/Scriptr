'use client'

import { UI_STRINGS } from '@shared/config/strings'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { Dialog } from '@/components/ui/Dialog'
import { useNotifications } from '@/providers/notification/NotificationProvider'

/** Shown when a restricted user attempts a restricted action. The reason and
 * end date come from the persistent restriction notice, which loads right
 * after the rejection, so the body fills in a moment after the modal opens. */
export const RestrictedActionModal = () => {
  const { restrictedModalOpen, closeRestrictedModal, restrictionNotice } =
    useNotifications()

  if (!restrictedModalOpen) return null

  return (
    <Dialog
      title={UI_STRINGS.general.restrictedModalTitle}
      hideTrigger
      isOpen
      onClose={closeRestrictedModal}
      dialogProps={{
        className: 'md:w-[min(28rem,calc(100vw-2rem))] md:min-w-0',
      }}
    >
      <Box className='ui-stack gap-3 p-5' role='alertdialog'>
        <Text className='ui-body-strong'>
          {UI_STRINGS.general.restrictedModalIntro}
        </Text>
        {restrictionNotice && (
          <Text className='ui-body'>{restrictionNotice.body}</Text>
        )}
        <Box className='ui-cluster justify-end'>
          <Button onClick={closeRestrictedModal} className='button solid'>
            {UI_STRINGS.general.restrictedModalClose}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
