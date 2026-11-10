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
  /** The study the notification's content belongs to. Null (or omitted) for
   * account-wide notifications — announcements, restrictions, and achievements
   * that are not study-scoped. */
  studyId?: string | null
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
    const { type, title, body, data, studyId } = notification
    const { error } = await client.from('notifications').insert({
      profile_id: profileId,
      type,
      title,
      body,
      data,
      study_id: studyId ?? null,
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
      .select('reporter_id, study_id')
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

    // A flag on a user has no study, so it alerts owners only.
    const studyId =
      (flags ?? []).find((flag) => flag.study_id)?.study_id ?? null

    const [{ data: owners, error: ownersError }, { data: existing, error }] =
      await Promise.all([
        supabase.from('profiles').select('id').eq('role', 'owner'),
        supabase
          .from('notifications')
          .select('profile_id')
          .eq('type', 'flag_threshold')
          .contains('data', {
            target_type: targetType,
            target_id: targetId,
          }),
      ])

    if (ownersError || error) {
      honoLog({
        logLevel: 'error',
        message: 'Failed to check admins or existing flag alerts',
        error: ownersError ?? error,
      })
      return
    }

    const { data: studyStaff, error: studyStaffError } = studyId
      ? await supabase
          .from('study_roles')
          .select('profile_id')
          .eq('study_id', studyId)
      : { data: [], error: null }

    if (studyStaffError) {
      honoLog({
        logLevel: 'error',
        message: 'Failed to read the study roles for a flag alert',
        error: studyStaffError,
      })
      return
    }

    // The owner sees every study; a study admin or moderator sees their own.
    const admins = [
      ...new Set([
        ...(owners ?? []).map((owner) => owner.id),
        ...(studyStaff ?? []).map((staff) => staff.profile_id),
      ]),
    ]

    const alreadyNotified = new Set(
      (existing ?? []).map((notification) => notification.profile_id)
    )
    const title = NOTIFICATIONS_STRINGS.flagThresholdTitle
    const body = NOTIFICATIONS_STRINGS.flagThresholdBody(
      reporterCount,
      targetType
    )

    await Promise.all(
      admins
        .filter((adminId) => !alreadyNotified.has(adminId))
        .map((adminId) =>
          insertNotificationBestEffort(supabase, adminId, {
            type: 'flag_threshold',
            title,
            body,
            studyId,
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
