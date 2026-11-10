import { apiRoutes } from '@shared/config/api-routes'
import type { NotificationRecord } from '@shared/types/api.types'
import type {
  BroadcastNotificationRequest,
  BroadcastNotificationResponse,
  NotificationWithStudy,
} from '@shared/types/notifications.types'
import { apiFetchRequired } from './next-api'

const noStore = { cache: 'no-store' } as const

export const getNotifications = (cookie?: string) =>
  apiFetchRequired<Array<NotificationWithStudy>>(
    apiRoutes.notifications.index,
    {
      ...noStore,
      ...(cookie ? { headers: { cookie } } : {}),
    }
  )

export const setNotificationRead = (id: string, isRead: boolean) =>
  apiFetchRequired<NotificationRecord>(apiRoutes.notifications.byId(id), {
    method: 'PATCH',
    body: { is_read: isRead },
  })

export const markAllNotificationsRead = () =>
  apiFetchRequired<{ success: true }>(apiRoutes.notifications.readAll, {
    method: 'PATCH',
  })

export const deleteNotification = (id: string) =>
  apiFetchRequired<{ success: true }>(apiRoutes.notifications.byId(id), {
    method: 'DELETE',
  })

/** Sends one announcement to every profile, or to one study's people.
 * Admin session + unlock required; `recipients` is how many profiles it was
 * written for. */
export const broadcastAnnouncement = (
  announcement: BroadcastNotificationRequest
) =>
  apiFetchRequired<BroadcastNotificationResponse>(
    apiRoutes.admin.notifications,
    {
      method: 'POST',
      body: {
        title: announcement.title,
        body: announcement.body,
        studyId: announcement.studyId ?? null,
      },
    }
  )
