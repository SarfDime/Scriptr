'use client'

import CloseCircle from '@sanity/icons/CloseCircle'
import Spinner from '@sanity/icons/Spinner'
import { NOTIFICATIONS_STRINGS } from '@shared/strings/notifications-strings'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { Text } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import { useNotifications } from '@/providers/notification/NotificationProvider'
import { Dialog } from '../ui/Dialog'
import { Divider } from '../ui/Divider'
import { NotificationRow } from './NotificationRow'

/** Notification shade: a bell trigger plus a slide-over aside. The aside's
 * content only mounts while open. */
export const NotificationsAside = () => {
  const {
    notifications,
    dismissAll,
    trayOpen,
    setTrayOpen,
    loading,
    error,
    refresh,
  } = useNotifications()
  const hasDismissible = notifications.some(
    (notification) => !notification.persistent
  )

  return (
    <Dialog
      as='aside'
      aria-label={NOTIFICATIONS_STRINGS.openNotifications}
      isOpen={trayOpen}
      title={
        <Box
          className='ui-cluster'
          aria-live='polite'
          aria-description={NOTIFICATIONS_STRINGS.loading}
        >
          {NOTIFICATIONS_STRINGS.trayTitle}
          {loading && <Spinner className={'h-4 w-4 animate-spin'} />}
        </Box>
      }
      hideTrigger
      onClose={() => setTrayOpen(false)}
      placement='right'
      hideBackdrop={true}
      dialogProps={{
        className: cn(
          'fixed top-16 z-50 ui-stack h-[calc(100%-4rem)] w-full max-w-full md:max-w-sm overflow-y-auto md:min-w-[unset] md:w-full',
          trayOpen && 'transition-transform transform translate-x-0',
          !trayOpen && 'transition-transform transform translate-x-full',
          'ui-above-drawer'
        ),
      }}
      headerProps={{
        className: 'ui-cluster justify-between',
      }}
    >
      {hasDismissible && (
        <>
          <Button onClick={dismissAll} className='button button-sm subtle'>
            <CloseCircle />
            {NOTIFICATIONS_STRINGS.dismissAll}
          </Button>
          <Divider />
        </>
      )}

      {error && (
        <Box role='alert' className='ui-cluster justify-between'>
          <Text className='ui-caption'>{error}</Text>
          <Button onClick={refresh} className='button subtle px-3 py-1'>
            {NOTIFICATIONS_STRINGS.retry}
          </Button>
        </Box>
      )}
      {notifications.length > 0 ? (
        <Box className='ui-stack gap-2'>
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
            />
          ))}
        </Box>
      ) : (
        !loading && (
          <Text className='ui-caption'>{NOTIFICATIONS_STRINGS.empty}</Text>
        )
      )}
    </Dialog>
  )
}
