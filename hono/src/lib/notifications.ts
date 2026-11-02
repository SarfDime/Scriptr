import type { Context } from 'hono'
import { NOTIFICATIONS_STRINGS } from '../../../shared/strings/notifications-strings'
import type { FlagTargetType } from '../../../shared/types/api.types'
import type { Json } from '../../../shared/types/database.types'
import type { NotificationKind } from '../../../shared/types/notifications.types'
import type { HonoEnv } from '../types/env.types'
import { shouldAlertAtThreshold } from './flag-alerts'
import { honoLog } from './logger'
import { createInternalSupabaseClient, createSupabaseClient } from './supabase'

type NotificationInput = {
  type: NotificationKind
  title: string
  body: string | null
  data: Json | null
}

type NotificationClient =
  | ReturnType<typeof createSupabaseClient>
  | ReturnType<typeof createInternalSupabaseClient>

export const insertNotificationBestEffort = async (
  client: NotificationClient,
  profileId: string,
  notification: NotificationInput
) => {
  try {
    const { error } = await client.from('notifications').insert({
      profile_id: profileId,
      ...notification,
    })
    if (error) {
      honoLog({
        logLevel: 'error',
        message: `Failed to insert ${notification.type} notification`,
        error,
      })
    }
  } catch (error) {
    honoLog({
      logLevel: 'error',
      message: `Failed to insert ${notification.type} notification`,
      error,
    })
  }
}

export const notifyProfileBestEffort = async (
  c: Context<HonoEnv>,
  profileId: string,
  notification: NotificationInput
) =>
  insertNotificationBestEffort(createSupabaseClient(c), profileId, notification)

export const notifyAdminsAtFlagThreshold = async (
  c: Context<HonoEnv>,
  targetType: FlagTargetType,
  targetId: string,
  href: string
) => {
  try {
    const supabase = createInternalSupabaseClient(c)
    const targetColumn = {
      script: 'target_script_id',
      comment: 'target_comment_id',
      user: 'target_user_id',
    }[targetType]

    const { data: flags, error: flagsError } = await supabase
      .from('flags')
      .select('reporter_id')
      .eq(targetColumn, targetId)
      .neq('status', 'dismissed')
    if (flagsError) {
      honoLog({
        logLevel: 'error',
        message: 'Failed to count distinct flag reporters',
        error: flagsError,
      })
      return
    }

    const reporterCount = new Set((flags ?? []).map((flag) => flag.reporter_id))
      .size
    if (!shouldAlertAtThreshold(reporterCount)) return

    const [{ data: admins, error: adminsError }, { data: existing, error }] =
      await Promise.all([
        supabase.from('profiles').select('id').eq('role', 'admin'),
        supabase
          .from('notifications')
          .select('profile_id')
          .eq('type', 'flag_threshold')
          .contains('data', {
            target_type: targetType,
            target_id: targetId,
          }),
      ])

    if (adminsError || error) {
      honoLog({
        logLevel: 'error',
        message: 'Failed to check admins or existing flag alerts',
        error: adminsError ?? error,
      })
      return
    }

    const alreadyNotified = new Set(
      (existing ?? []).map((notification) => notification.profile_id)
    )
    const title = NOTIFICATIONS_STRINGS.flagThresholdTitle
    const body = NOTIFICATIONS_STRINGS.flagThresholdBody(
      reporterCount,
      targetType
    )

    await Promise.all(
      (admins ?? [])
        .filter((admin) => !alreadyNotified.has(admin.id))
        .map((admin) =>
          insertNotificationBestEffort(supabase, admin.id, {
            type: 'flag_threshold',
            title,
            body,
            data: {
              target_type: targetType,
              target_id: targetId,
              count: reporterCount,
              href,
            },
          })
        )
    )
  } catch (error) {
    honoLog({
      logLevel: 'error',
      message: 'Failed to send flag threshold notifications',
      error,
    })
  }
}
